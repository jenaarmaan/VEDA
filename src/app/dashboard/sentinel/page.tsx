'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Settings,
  UserCircle,
  ClipboardList,
  Users,
  Bell,
  ChartBar,
  AtSign,
} from 'lucide-react';
import Spinner from '@/components/shared/Spinner';

interface Report {
  id: string;
  contentData: string;
  status: string;
  assignedTo?: string;
  priority?: string;
  createdAt: any;
}

interface Officer {
  id: string;
  name: string;
  role: string;
  workload: number;
  available: boolean;
}

export default function SentinelDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingOfficers, setLoadingOfficers] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setLoadingReports(true);
      try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const loadedReports: Report[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Report));
        setReports(loadedReports);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoadingReports(false);
      }
    }
    fetchReports();
  }, []);

  useEffect(() => {
    async function fetchOfficers() {
      setLoadingOfficers(true);
      try {
        const officersRef = collection(db, 'officers');
        const snapshot = await getDocs(officersRef);
        const loadedOfficers: Officer[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Officer));
        setOfficers(loadedOfficers);
      } catch (err) {
        console.error('Failed to fetch officers:', err);
      } finally {
        setLoadingOfficers(false);
      }
    }
    fetchOfficers();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#131314] text-gray-200">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 h-16">
              <h2 className="text-xl font-bold">Sentinel Dashboard</h2>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ClipboardList />
                  Incoming Reports
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <AtSign />
                  My Assignments
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Users />
                  Officers & Departments
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ChartBar />
                  Reports & Analytics
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Bell />
                  Notifications
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="mt-6 space-y-8">
              {/* Summary KPIs */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold">{reports.length}</div>
                    <div className="text-sm text-gray-400">Total Reports</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold">{reports.filter(r => r.status === 'pending').length}</div>
                    <div className="text-sm text-gray-400">Pending Reports</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold">{reports.filter(r => r.status === 'in-progress').length}</div>
                    <div className="text-sm text-gray-400">In-Progress</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold">{reports.filter(r => r.status === 'resolved').length}</div>
                    <div className="text-sm text-gray-400">Resolved Cases</div>
                  </div>
                </div>
              </section>

              {/* Incoming Reports Table */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Incoming Reports</h3>
                <div className="overflow-auto max-h-72 bg-gray-900 rounded-md p-3">
                  {loadingReports ? (
                    <Spinner />
                  ) : reports.length === 0 ? (
                    <p className="text-center text-gray-500">No reports available</p>
                  ) : (
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="p-2 text-left">Content</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Assigned To</th>
                          <th className="p-2 text-left">Priority</th>
                          <th className="p-2 text-left">Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map(report => (
                          <tr key={report.id} className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer">
                            <td className="p-2 truncate max-w-xs" title={report.contentData}>{report.contentData}</td>
                            <td className="p-2">{report.status}</td>
                            <td className="p-2">{report.assignedTo || 'Unassigned'}</td>
                            <td className="p-2">{report.priority || '-'}</td>
                            <td className="p-2">
                              {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : 'Unknown'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Officers Overview */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Officers & Workload</h3>
                <div className="overflow-auto max-h-64 bg-gray-900 rounded-md p-3">
                  {loadingOfficers ? (
                    <Spinner />
                  ) : officers.length === 0 ? (
                    <p className="text-center text-gray-500">No officers found</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Role</th>
                          <th className="p-2 text-left">Workload</th>
                          <th className="p-2 text-left">Availability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {officers.map(officer => (
                          <tr key={officer.id} className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer">
                            <td className="p-2">{officer.name}</td>
                            <td className="p-2">{officer.role}</td>
                            <td className="p-2">{officer.workload}</td>
                            <td className="p-2">
                              {officer.available ? (
                                <span className="text-green-400">Available</span>
                              ) : (
                                <span className="text-red-400">Busy</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <UserCircle />
                  Profile
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col p-6 bg-[#1a1a1a] overflow-y-auto">
          <h1 className="text-3xl font-bold mb-4 text-white">Welcome, Agency Head</h1>
          {/* Additional dashboard content can be added here */}
        </main>
      </div>
    </SidebarProvider>
  );
}
