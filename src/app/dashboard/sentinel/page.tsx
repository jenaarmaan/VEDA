"use client";
import React, { useState, useEffect, Fragment } from "react";
import {
  Sidebar,
  SidebarProvider,
} from "@/components/ui/sidebar";

type TeamMember = { id: string; name: string; position: string; email: string; phone: string; };
type Assignment = { officerId: string; officerName: string; officerEmail: string; task: string; };
type CaseStatus = "Queued" | "Verified" | "Re-Verification" | "Under-Review";
type CaseItem = { id: string; slno: number; subject: string; reporterEmail: string; status: CaseStatus; assignments: Assignment[]; reportFile?: string; };

const TEAM_KEY = "sentinel_team2";
const CASES_KEY = "sentinel_cases2";
const DARK_KEY = "sentinel_dark2";
function uuid() { return Math.random().toString(36).slice(2, 14); }
function getLS<T>(key: string, fallback: T) { if (typeof window === "undefined") return fallback; const val = localStorage.getItem(key); return val ? (JSON.parse(val) as T) : fallback; }
function setLS<T>(key: string, val: T) { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(val)); }

const seedTeam: TeamMember[] = [
  { id: uuid(), name: "Samira Rao", position: "Lead Investigator", email: "samira.rao@agency.com", phone: "555-1234" },
  { id: uuid(), name: "Jordan Witt", position: "Field Agent", email: "jordan.witt@agency.com", phone: "555-4747" },
  { id: uuid(), name: "Lee Chao", position: "Analyst", email: "lee.chao@agency.com", phone: "555-3838" },
];
const seedCases: CaseItem[] = [
  { id: uuid(), slno: 1, subject: "Suspicious Package at Metro", reporterEmail: "citizen99@email.com", status: "Queued", assignments: [] },
  { id: uuid(), slno: 2, subject: "Data Breach - Hospital Records", reporterEmail: "whistle@info.org", status: "Verified", assignments: [] },
];

// ICONS for the left menu
const icon = {
  feedback: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15.5 10.5c1.38 0 2.5-1.12 2.5-2.5S16.88 5.5 15.5 5.5 13 6.62 13 8s1.12 2.5 2.5 2.5Zm-7 0C9.88 10.5 11 9.38 11 8s-1.12-2.5-2.5-2.5S6 6.62 6 8s1.12 2.5 2.5 2.5Zm0 2c-1.67 0-5 0.83-5 2.5V17h10v-2c0-1.67-3.33-2.5-5-2.5Zm7 0c-.29 0-.62 0.02-.97 0.05A6.467 6.467 0 0 1 20 15v2h-4v-2c0-1.32-1.37-2-2.5-2Z" fill="currentColor"/></svg>
  ),
  general: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15A1.65 1.65 0 0 1 22 17.1v2.14A2 2 0 0 1 20 21a1.65 1.65 0 0 1-2.27-.6M4.6 15A1.65 1.65 0 0 1 2 17.1v2.14A2 2 0 0 0 4 21a1.65 1.65 0 0 0 2.27-.6" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  notifications: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 22a2 2 0 002-2H10a2 2 0 002 2Zm6-6V9a6 6 0 10-12 0v7l-2 2v1h16v-1l-2-2Z" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  personalization: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  datacontrols: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect width="18" height="14" x="3" y="5" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 3v4M17 3v4M3 11h18" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  security: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect width="14" height="14" x="5" y="5" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M12 11v3" stroke="currentColor" strokeWidth="2"/></svg>
  ),
};

const settingsSections = [
  { key: "feedback", label: "Feedback", icon: icon.feedback },
  { key: "general", label: "General", icon: icon.general },
  { key: "notifications", label: "Notifications", icon: icon.notifications },
  { key: "personalization", label: "Personalization", icon: icon.personalization },
  { key: "datacontrols", label: "Data controls", icon: icon.datacontrols },
  { key: "security", label: "Security", icon: icon.security },
];

function SettingsModal({
  open, onClose, section, setSection, dark, setDark, notifications, setNotifications,
}: {
  open: boolean;
  onClose: () => void;
  section: string;
  setSection: (k: string) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  notifications: boolean;
  setNotifications: (b: boolean) => void;
}) {
  useEffect(() => { if (open) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-950 dark:bg-black text-white shadow-2xl rounded-2xl w-[95vw] max-w-4xl h-[90vh] flex overflow-hidden relative border border-neutral-800 animate-fadeIn ring-1 ring-neutral-700">
        <button onClick={onClose} aria-label="Close" className="absolute left-4 top-4 z-10 p-2 rounded hover:bg-neutral-800 text-lg">✕</button>
        {/* Sidebar */}
        <nav className="w-60 min-w-[176px] bg-neutral-900 border-r border-neutral-800 pt-10 space-y-1 flex flex-col">
          {settingsSections.map(sec => (
            <button
              key={sec.key}
              className={`flex items-center gap-3 px-5 py-3 w-full text-left rounded-lg transition
                ${section === sec.key ? "bg-neutral-800 text-blue-400 font-bold" : "text-neutral-300 hover:bg-neutral-800"}`}
              onClick={() => setSection(sec.key)}
            >
              <span className="text-xl">{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </nav>
        {/* Main settings */}
        <div className="flex-1 overflow-y-auto pt-10 px-8 pb-8 bg-neutral-950 dark:bg-black min-w-0">
          {section === "feedback" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Feedback</h2>
              <p className="text-neutral-300 mb-6">We value your feedback! Click below to let us know your thoughts or report an issue.</p>
              <button
                onClick={() => { window.location.href = "/feedback"; }}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 font-semibold text-white text-md rounded shadow"
              >
                Submit Feedback
              </button>
            </div>
          )}
          {section === "general" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">General</h2>
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg">Theme</span>
                <select
                  className="bg-neutral-800 py-2 px-4 rounded text-md"
                  value={dark ? "dark" : "light"}
                  onChange={e => setDark(e.target.value === "dark")}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
          )}
          {section === "notifications" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Notifications</h2>
              <div className="flex items-center justify-between">
                <span className="text-lg">Enable notifications</span>
                <label className="inline-flex relative items-center cursor-pointer">
                  <input type="checkbox" checked={notifications} className="sr-only peer" onChange={e => setNotifications(e.target.checked)} />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer dark:bg-neutral-700 peer-checked:bg-blue-700 transition"></div>
                  <span className="ml-3 text-sm">{notifications ? "On" : "Off"}</span>
                </label>
              </div>
            </div>
          )}
          {section === "personalization" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Personalization</h2>
              <p className="text-neutral-300">Coming soon.</p>
            </div>
          )}
          {section === "datacontrols" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Data controls</h2>
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <span>Improve the model for everyone</span>
                  <span className="bg-blue-700/70 text-white text-xs px-3 py-1 rounded-full">On</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Shared links</span>
                  <button className="px-4 py-1 rounded bg-neutral-800 hover:bg-neutral-700">Manage</button>
                </li>
                <li className="flex items-center justify-between">
                  <span>Archived reports</span>
                  <button className="px-4 py-1 rounded bg-neutral-800 hover:bg-neutral-700">Manage</button>
                </li>
                <li className="flex items-center justify-between">
                  <span>Archive all reports</span>
                  <button className="px-4 py-1 rounded bg-neutral-800 hover:bg-neutral-700">Archive all</button>
                </li>
                <li className="flex items-center justify-between">
                  <span>Delete all reports</span>
                  <button className="px-4 py-1 rounded bg-red-600 hover:bg-red-700 font-semibold">Delete all</button>
                </li>
                <li className="flex items-center justify-between">
                  <span>Export data</span>
                  <button className="px-4 py-1 rounded bg-neutral-800 hover:bg-neutral-700">Export</button>
                </li>
              </ul>
            </div>
          )}
          {section === "security" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Security</h2>
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <span>Multi-factor authentication</span>
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer dark:bg-neutral-700 peer-checked:bg-blue-700 transition"></div>
                  </label>
                </li>
                <li className="flex items-center justify-between">
                  <span>Log out of this device</span>
                  <button className="px-4 py-1 rounded bg-neutral-800 hover:bg-neutral-700">Log out</button>
                </li>
                <li className="flex items-center justify-between">
                  <span>Log out of all devices</span>
                  <button className="px-4 py-1 rounded bg-red-600 hover:bg-red-700 font-semibold">Log out all</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ... Sidebar, TeamModal, AssignDropdown same as before ...

export default function SentinelDashboardPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [dark, setDark] = useState(() => !!getLS(DARK_KEY, true));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", Boolean(dark));
    setLS(DARK_KEY, dark);
  }, [dark]);
  const [team, setTeam] = useState<TeamMember[]>(() => getLS(TEAM_KEY, seedTeam));
  useEffect(() => setLS(TEAM_KEY, team), [team]);
  const [cases, setCases] = useState<CaseItem[]>(() => getLS(CASES_KEY, seedCases));
  const [slno, setSlno] = useState(() => cases.length ? Math.max(...cases.map(c => c.slno)) + 1 : seedCases.length + 1);
  useEffect(() => setLS(CASES_KEY, cases), [cases]);
  useEffect(() => {
    const id = setInterval(() => {
      const fakeCases = [
        { subject: "Misinformation on Public Health", email: "tipster@protonmail.com" },
        { subject: "Bogus Viral Video", email: "anon@report.org" },
        { subject: "Harassment Report", email: "civic.user@yahoo.com" },
        { subject: "Cloned Social Media Account", email: "fakeaccount@ymail.com" },
      ];
      const pick = fakeCases[Math.floor(Math.random() * fakeCases.length)];
      setCases((prev) => [...prev, {
        id: uuid(),
        slno,
        subject: pick.subject,
        reporterEmail: pick.email,
        status: "Queued",
        assignments: [],
      }]);
      setSlno(s => s + 1);
    }, 20000);
    return () => clearInterval(id);
  }, [slno]);
  const [teamModal, setTeamModal] = useState(false);
  const [assignShow, setAssignShow] = useState<string | null>(null);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState("general");
  const [notifications, setNotifications] = useState(true);

  return (
    <SidebarProvider>
    <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans">
      <Sidebar>
        {/* Placeholder for Sidebar content */}
      </Sidebar>
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        section={settingsSection}
        setSection={setSettingsSection}
        dark={dark}
        setDark={setDark}
        notifications={notifications}
        setNotifications={setNotifications}
      />
      {/* ...main content and rest of dashboard (unchanged) ... */}
      <div className={`flex-1 min-h-screen transition-all ease-in ${sidebarExpanded ? "pl-56" : "pl-20 sm:pl-24"}`}>
        <main className="flex flex-col items-center flex-1 py-12 px-2 sm:px-8 w-full relative transition-all ease-in">
          <div className="w-full max-w-6xl">
            <div className="mb-8">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-neutral-900 dark:text-white" style={{ fontFamily: "Inter, Segoe UI, Arial, sans-serif" }}>
                Case History
              </div>
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
                          <select aria-label="Update Action"
                            className="px-3 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold"
                            value={c.status}
                            onChange={e => setCases(prev => prev.map(ca => ca.id !== c.id ? ca : { ...ca, status: e.target.value as CaseStatus }))}
                          >
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
        <TeamModal open={teamModal} onClose={() => setTeamModal(false)} team={team} setTeam={setTeam} />
      </div>
    </div>
    </SidebarProvider>
  );
}

// --- Reuse your Sidebar, TeamModal, AssignDropdown with "onOpenSettings" triggering setShowSettings(true) in this file. ---
// Note: AssignDropdown and TeamModal would need to be extracted or passed as props if they are not defined in this file.
// For the purpose of this fix, I am assuming they are defined elsewhere or their absence is not the cause of the current error.

function TeamModal({ open, onClose, team, setTeam }: { open: boolean, onClose: () => void, team: TeamMember[], setTeam: (team: TeamMember[]) => void }) {
  if (!open) return null;
  // Basic modal structure
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-white">Manage Team</h2>
        {/* Add team management UI here */}
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
      </div>
    </div>
  )
}

function AssignDropdown({ team, caseItem, onAssign, onHide }: { team: TeamMember[], caseItem: CaseItem, onAssign: (assignment: Assignment) => void, onHide: () => void }) {
  // Basic dropdown structure
  return (
    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-neutral-800 ring-1 ring-black ring-opacity-5 z-20">
      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        {team.map(member => (
          <button
            key={member.id}
            onClick={() => {
              onAssign({ officerId: member.id, officerName: member.name, officerEmail: member.email, task: 'Investigate' });
              onHide();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            role="menuitem"
          >
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}
