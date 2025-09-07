// src/app/dashboard/council/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
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
import { Settings, ClipboardList, Users, Bell, ChartBar, Shield } from 'lucide-react';
import Spinner from '@/components/shared/Spinner';

interface Report {
  id: string;
  contentData: string;
  status: string;
  riskLevel?: string;
  source?: string;
  verifiedAt?: any;
}

export default function CouncilDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const reportsRef = collection(db, 'council_reports');
        const snapshot = await getDocs(reportsRef);
        const loadedReports: Report[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Report));
        setReports(loadedReports);
      } catch (error) {
        console.error('Failed to fetch council reports:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#131314] text-gray-200">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 h-16">
              <h2 className="text-xl font-bold">Council Dashboard</h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ClipboardList />
                  All Reports
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Shield />
                  Audit Log
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ChartBar />
                  Insights & Trends
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Users />
                  Agencies
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
            <div className="mt-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">Verified News & Reports</h3>
                <div className="overflow-auto max-h-80 bg-gray-900 rounded-md p-3">
                  {loading ? (
                    <Spinner />
                  ) : reports.length === 0 ? (
                    <p className="text-center text-gray-500">No reports verified yet</p>
                  ) : (
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="p-2 text-left">Content</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Risk</th>
                          <th className="p-2 text-left">Source</th>
                          <th className="p-2 text-left">Verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map(report => (
                          <tr key={report.id} className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer">
                            <td className="p-2 truncate max-w-xs" title={report.contentData}>{report.contentData}</td>
                            <td className="p-2">{report.status}</td>
                            <td className={`p-2 font-semibold ${
                                report.riskLevel === "High" ? "text-red-400" :
                                report.riskLevel === "Medium" ? "text-yellow-300" : "text-green-400"
                            }`}>{report.riskLevel || "-"}</td>
                            <td className="p-2">{report.source || "-"}</td>
                            <td className="p-2">{report.verifiedAt ? new Date(report.verifiedAt.seconds * 1000).toLocaleString() : "-"}</td>
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
                  <Settings />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col p-6 bg-[#1a1a1a] overflow-y-auto">
          <h1 className="text-3xl font-bold mb-4 text-white">Welcome, Council Admin</h1>
          {/* Add aggregate statistics, highlight flagged cases, or insights here */}
        </main>
      </div>
    </SidebarProvider>
  );
}
