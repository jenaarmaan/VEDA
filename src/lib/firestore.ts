
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, serverTimestamp, updateDoc, addDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { Report, Task, UserProfile, AuditLog, Notification, ContactMessage } from './types';
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
    const q = query(usersRef, where('details.state', '==', agency));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

export async function getAllUsers(): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('email', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

export async function addUserToAgency(userData: { name: string, email: string, password: string, position: string, phone: string, agency: string, role: 'agency_employee' }): Promise<UserProfile> {
    // This function should ideally be an admin-only callable cloud function for security.
    // For now, we create the user directly from the client, which is not secure for production.
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const user = userCredential.user;

    const newUserProfile: Omit<UserProfile, 'uid' | 'createdAt' | 'details' > & {details: Partial<UserProfile['details']>} = {
        email: userData.email,
        role: 'sentinel', // Placeholder for a more complex role system
        details: {
          fullName: userData.name,
          phone: userData.phone,
        },
    };

    await setDoc(doc(db, 'users', user.uid), newUserProfile);
    return { uid: user.uid, ...newUserProfile, createdAt: serverTimestamp(), details: user.photoURL as any };
}

export async function removeUserFromAgency(userId: string): Promise<void> {
    // This is also insecure from the client. Should be a cloud function.
    // It only deletes the Firestore record, not the Auth user.
    await deleteDoc(doc(db, 'users', userId));
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
  
  await createNotification(taskData.assignedTo, `You have been assigned a new task for report ${taskData.reportId.substring(0,8)}.`);

  // Update report status
  const reportRef = doc(db, 'reports', taskData.reportId);
  await updateDoc(reportRef, { status: 'Under Review' });

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

export async function updateTaskStatus(taskId: string, status: Task['status'], actorId: string): Promise<void> {
    const taskRef = doc(db, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) throw new Error("Task not found");
    const taskData = taskDoc.data() as Task;
    
    await updateDoc(taskRef, { status, updatedAt: Date.now() });
    await createAuditLog(actorId, 'update_task_status', { taskId, newStatus: status });
    await createNotification(taskData.assignedBy, `Task ${taskId.substring(0,8)} status has been updated to ${status}.`);
}

export async function reassignTask(taskId: string, newAssignedTo: string, actorId: string): Promise<void> {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { assignedTo: newAssignedTo, updatedAt: Date.now() });
    await createAuditLog(actorId, 'reassign_task', { taskId, newAssignedTo });
    await createNotification(newAssignedTo, `A task has been reassigned to you.`);
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

export async function getAuditLogs(filters: { userId?: string, reportId?: string, startDate?: Date, endDate?: Date }): Promise<AuditLog[]> {
    const auditLogsRef = collection(db, 'audit_logs');
    let q = query(auditLogsRef, orderBy('timestamp', 'desc'));

    if (filters.userId) {
        q = query(q, where('actorId', '==', filters.userId));
    }
    if (filters.reportId) {
        q = query(q, where('details.reportId', '==', filters.reportId));
    }
     if (filters.startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
}


// Notifications
export async function createNotification(userId: string, message: string): Promise<void> {
    const notificationId = uuidv4();
    const notificationRef = doc(db, 'notifications', notificationId);
    const newNotification: Omit<Notification, 'id'> = {
        userId,
        message,
        isRead: false,
        createdAt: Date.now(),
    };
    await setDoc(notificationRef, newNotification);

    // Placeholder for real-time/push/email notification
    console.log(`--- NOTIFICATION CREATED for ${userId} ---`);
    console.log(`Message: ${message}`);
    console.log("-----------------------------------------");
}

// Contact Messages
export async function createContactMessage(messageData: Omit<ContactMessage, 'id' | 'createdAt'>): Promise<void> {
    const contactsRef = collection(db, 'contacts');
    await addDoc(contactsRef, {
        ...messageData,
        createdAt: serverTimestamp(),
    });
}
