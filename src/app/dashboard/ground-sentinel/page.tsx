
'use client';
import React, { useState, useEffect } from 'react';

// Sample data structure for cases assigned to a Ground Sentinel
type Case = {
  id: string;
  subject: string;
  assigner: string;
  status: 'Queued' | 'Verified' | 'Re-verification' | 'Under-review';
};

// Sample data - in a real app, this would be fetched from Firestore
const initialCases: Case[] = [
  {
    id: 'CASE001',
    subject: 'Noise Complaint at Sector 17',
    assigner: 'sentinel1@agency.com',
    status: 'Queued',
  },
  {
    id: 'CASE002',
    subject: 'Unauthorized Construction Detected',
    assigner: 'sentinel2@agency.com',
    status: 'Verified',
  },
];

const STATUS_OPTIONS: Case['status'][] = ['Queued', 'Verified', 'Re-verification', 'Under-review'];

export default function GroundSentinelDashboard() {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleStatusChange = (caseId: string, newStatus: Case['status']) => {
    setCases(prevCases =>
      prevCases.map(c => (c.id === caseId ? { ...c, status: newStatus } : c))
    );
  };

  const handleUploadReport = (caseId: string) => {
    // Mock function: In a real app, this would trigger a file upload modal or logic
    alert(`Upload report for Case ID: ${caseId}`);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-card text-card-foreground border-r border-border transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between h-16 p-4 border-b border-border">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>G. Sentinel</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-accent">
            {/* Simple Menu Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           <a href="#" className="flex items-center p-2 space-x-3 rounded-md bg-primary text-primary-foreground">
             <span className="font-semibold">⏳</span>
             <span className={`${!sidebarOpen && 'hidden'}`}>Case History</span>
           </a>
           <a href="#" className="flex items-center p-2 space-x-3 rounded-md hover:bg-accent">
             <span className="font-semibold">⚙️</span>
             <span className={`${!sidebarOpen && 'hidden'}`}>Settings</span>
           </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Case Dashboard</h2>
          <p className="text-muted-foreground">Manage your assigned verification tasks.</p>
        </header>
        
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4">Case ID</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Assigned By</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr key={caseItem.id} className="border-b border-border hover:bg-accent/50">
                  <td className="p-4 font-mono text-sm">{caseItem.id}</td>
                  <td className="p-4">{caseItem.subject}</td>
                  <td className="p-4 text-muted-foreground">{caseItem.assigner}</td>
                  <td className="p-4">
                    <select
                      value={caseItem.status}
                      onChange={(e) => handleStatusChange(caseItem.id, e.target.value as Case['status'])}
                      className="bg-input border border-border rounded-md px-3 py-1.5 text-sm"
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('-', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleUploadReport(caseItem.id)}
                      className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-primary/90"
                    >
                      Upload Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cases.length === 0 && <p className="text-center p-8 text-muted-foreground">No cases assigned.</p>}
        </div>
      </main>
    </div>
  );
}
