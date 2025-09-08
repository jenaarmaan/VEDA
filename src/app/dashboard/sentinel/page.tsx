"use client";
import React, { useState, useEffect } from "react";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";

// Helper functions and constants that were missing
const DARK_KEY = "VEDA_DARK_MODE";
const TEAM_KEY = "VEDA_TEAM";
const CASES_KEY = "VEDA_CASES";

function getLS<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved) as T;
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
      return defaultValue;
    }
  }
  return defaultValue;
}

function setLS<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to set to localStorage", e);
  }
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

type TeamMember = { id: string; name: string; email: string };
type CaseStatus = "Queued" | "Verified" | "Re-Verification" | "Under-Review";
type CaseItem = {
  id: string;
  slno: number;
  subject: string;
  reporterEmail: string;
  status: CaseStatus;
  assignments: string[];
  reportFile?: string;
};

const seedTeam: TeamMember[] = [
  { id: uuid(), name: "Anjali Sharma", email: "anjali.s@veda.gov" },
  { id: uuid(), name: "Rajesh Kumar", email: "rajesh.k@veda.gov" },
  { id: uuid(), name: "Priya Singh", email: "priya.s@veda.gov" },
];

const seedCases: CaseItem[] = [
  { id: uuid(), slno: 1, subject: "Misleading Health Claims on Social Media", reporterEmail: "user123@email.com", status: "Queued", assignments: [] },
  { id: uuid(), slno: 2, subject: "Financial Scam Alert - Phishing Email", reporterEmail: "concerned@citizen.org", status: "Under-Review", assignments: ["Anjali Sharma"] },
];

// (Paste the SidebarItem, TeamModal, AssignDropdown, and SettingsModal code here without duplicating any identifiers)
// Since these components are not defined elsewhere, let's define simplified versions or remove them for now.
// For the purpose of fixing the immediate error, we will keep the logic but assume these components exist or will be created.
// To prevent further reference errors, dummy components will be created.

const TeamModal = ({ open, onClose, team, setTeam }: { open: boolean, onClose: () => void, team: TeamMember[], setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>> }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-bold">Manage Team</h2>
        {/* Simplified team management UI */}
        <div className="mt-4">
          {team.map(member => <div key={member.id}>{member.name}</div>)}
        </div>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Close</button>
      </div>
    </div>
  );
};

const AssignDropdown = ({ team, caseItem, onAssign, onHide }: { team: TeamMember[], caseItem: CaseItem, onAssign: (name: string) => void, onHide: () => void }) => (
  <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg border dark:border-neutral-700">
    <ul>
      {team.map(member => (
        <li key={member.id} onClick={() => { onAssign(member.name); onHide(); }} className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer">
          {member.name}
        </li>
      ))}
    </ul>
    <button onClick={onHide} className="w-full text-left px-4 py-2 border-t dark:border-neutral-700 text-red-500">Close</button>
  </div>
);

const SettingsModal = ({ open, onClose, section, setSection, dark, setDark, notifications, setNotifications }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-bold">Settings</h2>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Close</button>
      </div>
    </div>
  );
};


export default function SentinelDashboardPage() {
  // All previous state and useEffects for theme, data, side effects
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [dark, setDark] = useState(() => !!getLS(DARK_KEY, true));
  const [notifications, setNotifications] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>(() => getLS(TEAM_KEY, seedTeam));
  const [cases, setCases] = useState<CaseItem[]>(() => getLS(CASES_KEY, seedCases));
  const [slno, setSlno] = useState(() => cases.length ? Math.max(...cases.map((c) => c.slno)) + 1 : seedCases.length + 1);
  const [teamModal, setTeamModal] = useState(false);
  const [assignShow, setAssignShow] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("general");

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); setLS(DARK_KEY, dark); }, [dark]);
  useEffect(() => { setLS(TEAM_KEY, team); }, [team]);
  useEffect(() => { setLS(CASES_KEY, cases); }, [cases]);
  useEffect(() => {
    const interval = setInterval(() => {
      const fakeCases = [
        { subject: "Suspicious Package at Metro", reporterEmail: "citizen99@email.com" },
        { subject: "Data Breach - Hospital Records", reporterEmail: "whistle@info.org" },
        { subject: "Bogus Viral Video", reporterEmail: "anon@report.org" },
        { subject: "Harassment Report", reporterEmail: "civic.user@yahoo.com" },
      ];
      const pick = fakeCases[Math.floor(Math.random() * fakeCases.length)];
      setCases((prev) => [
        ...prev,
        { id: uuid(), slno, subject: pick.subject, reporterEmail: pick.reporterEmail, status: "Queued", assignments: [] },
      ]);
      setSlno((prev) => prev + 1);
    }, 20000);
    return () => clearInterval(interval);
  }, [slno]);
  const openTeam = () => setTeamModal(true);
  const closeTeam = () => setTeamModal(false);
  const openSettings = () => { setSettingsSection("general"); setSettingsOpen(true); };
  const closeSettings = () => setSettingsOpen(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans">
        {/* Sidebar component is missing, assuming a placeholder or it will be added */}
        <SettingsModal
          open={settingsOpen}
          onClose={closeSettings}
          section={settingsSection}
          setSection={setSettingsSection}
          dark={dark}
          setDark={setDark}
          notifications={notifications}
          setNotifications={setNotifications}
        />
        {teamModal && (
          <TeamModal open={teamModal} onClose={closeTeam} team={team} setTeam={setTeam} />
        )}
        <div className={`flex-1 min-h-screen transition-all ease-in ${sidebarExpanded ? "pl-56" : "pl-20 sm:pl-24"}`}>
          <main className="flex flex-col items-center flex-1 py-12 px-2 sm:px-8 w-full relative transition-all ease-in">
            <div className="w-full max-w-6xl">
              <div className="mb-8">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-neutral-900 dark:text-white" style={{ fontFamily: "Inter, Segoe UI, Arial, sans-serif" }}>Case History</div>
                <p className="text-neutral-600 dark:text-neutral-300 mt-1 font-medium">Incoming reports are listed below and updated live.</p>
              </div>
              <div className="overflow-x-auto shadow-lg rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-900 bg-white dark:bg-neutral-900">
                <table className="table-auto w-full rounded-xl overflow-hidden text-[15px]">
                  <thead className="bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold" style={{ fontFamily: "Inter, Segoe UI, Arial, sans-serif" }}>
                    <tr>
                      <th className="py-3 px-3">Sl. No.</th>
                      <th className="py-3 px-3">Case Subject</th>
                      <th className="py-3 px-3">Reporter Email</th>
                      <th className="py-3 px-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c, i) => (
                      <tr key={c.id} className={`transition-colors ${i % 2 === 0 ? "bg-neutral-100 dark:bg-neutral-950" : "bg-white dark:bg-neutral-900"}`}>
                        <td className="py-2 px-3 font-mono text-blue-800 dark:text-blue-300 font-bold">{c.slno}</td>
                        <td className="py-2 px-3 text-neutral-900 dark:text-neutral-100 font-semibold">{c.subject}</td>
                        <td className="py-2 px-3">
                          <button className="text-blue-700 hover:underline dark:text-blue-400 font-medium" aria-label="Send email" onClick={() => window.open(`mailto:${c.reporterEmail}`)}>Email</button>
                          <span className="block text-neutral-700 dark:text-neutral-200 text-xs font-normal mt-1">{c.reporterEmail}</span>
                        </td>
                        <td className="py-2 px-2 align-top text-center relative">
                          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2 items-center justify-center">
                            <div className="relative inline-block">
                              <button className="px-3 py-1 text-xs rounded bg-blue-700 hover:bg-blue-800 text-white shadow font-bold" aria-label="Assign officers" onClick={() => setAssignShow(c.id)}>Assign Officers</button>
                              {assignShow === c.id && (
                                <AssignDropdown
                                  key={c.id}
                                  team={team}
                                  caseItem={c}
                                  onAssign={ass => setCases(prev => prev.map(ca => ca.id !== c.id ? ca : { ...ca, assignments: [...ca.assignments, ass] }))}
                                  onHide={() => setAssignShow(null)}
                                />
                              )}
                            </div>
                            <select aria-label="Update Action" className="px-3 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold" value={c.status} onChange={e => setCases(prev => prev.map(ca => ca.id !== c.id ? ca : { ...ca, status: e.target.value as CaseStatus }))}>
                              <option>Queued</option>
                              <option>Verified</option>
                              <option>Re-Verification</option>
                              <option>Under-Review</option>
                            </select>
                            <label className="px-3 py-1 bg-neutral-300 dark:bg-neutral-800 rounded text-xs font-semibold cursor-pointer text-neutral-800 dark:text-neutral-100">
                              <input hidden type="file" aria-label="Upload report" onChange={e => {
                                if (!e.target.files || !e.target.files[0]) return;
                                setCases(prev => prev.map(ca => ca.id !== c.id ? ca : { ...ca, reportFile: e.target.files![0].name }));
                              }} />
                              {c.reportFile ? <span className="inline-flex items-center gap-1">📄<span className="truncate">{c.reportFile}</span></span> : "Submit Report"}
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {cases.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-neutral-400 dark:text-neutral-500">No cases to show.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
