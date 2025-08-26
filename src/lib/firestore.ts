import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Report, Task, UserProfile } from './types';
import { v4 as uuidv4 } from 'uuid';

// Reports
export async function getReportsForUser(userId: string): Promise<Report[]> {
  const reportsRef = collection(db, 'reports');
  const q = query(reportsRef, where('submittedBy', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
}

export async function getAllReports(): Promise<Report[]> {
  const reportsRef = collection(db, 'reports');
  const q = query(reportsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
}


// Users
export async function getUsersInAgency(agency: string): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('location', '==', agency));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

export async function getUsersInDepartment(agency: string, department: string): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, 
        where('location', '==', agency), 
        where('department', '==', department),
        where('role', '==', 'agency_employee')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
}


// Tasks
export async function assignTask(taskData: { reportId: string, assignedBy: string, assignedTo: string, department: string, agency: string }): Promise<string> {
  const taskId = uuidv4();
  const taskRef = doc(db, 'tasks', taskId);
  const newTask: Omit<Task, 'id'> = {
    ...taskData,
    taskId,
    status: 'Pending',
    notes: '',
    evidenceLinks: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(taskRef, newTask);
  await createAuditLog(taskData.assignedBy, 'assign_task', { taskId, reportId: taskData.reportId, assignedTo: taskData.assignedTo });
  
  // TODO: Send notification
  console.log(`Notification: Task ${taskId} assigned to ${taskData.assignedTo}`);

  return taskId;
}

export async function getAllTasks(): Promise<Task[]> {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}


export async function getTasksForUser(userId: string): Promise<Task[]> {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('assignedTo', '==', userId), orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export async function getTasksForAgency(agency: string): Promise<Task[]> {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('agency', '==', agency), orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export async function getTasksForDepartment(agency: string, department: string): Promise<Task[]> {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, 
        where('agency', '==', agency), 
        where('department', '==', department),
        orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export async function updateTaskStatus(taskId: string, status: Task['status'], actorId: string): Promise<void> {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status, updatedAt: Date.now() });
    await createAuditLog(actorId, 'update_task_status', { taskId, newStatus: status });
    // TODO: Send notification
}

export async function reassignTask(taskId: string, newAssignedTo: string, actorId: string): Promise<void> {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { assignedTo: newAssignedTo, updatedAt: Date.now() });
    await createAuditLog(actorId, 'reassign_task', { taskId, newAssignedTo });
    // TODO: Send notification
}


// Audit Logs
export async function createAuditLog(actorId: string, actionType: string, details: Record<string, any>): Promise<void> {
  const auditLogsRef = collection(db, 'audit_logs');
  await addDoc(auditLogsRef, {
    actorId,
    actionType,
    details,
    timestamp: serverTimestamp(),
  });
}
