
"use client";
import React, { useState, useEffect, useRef } from "react";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";


// --- Utils & Constants ---
const DARK_KEY = "sentinel_dark_mode";
const TEAM_KEY = "sentinel_team_data";
const CASES_KEY = "sentinel_cases_data";

function uuid() {
  return Math.random().toString(36).substring(2, 9);
}

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return fallback;
  }
}

function setLS<T>(key: string, value: T): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key “${key}”:`, error);
    }
  }
}

// --- Sample Data ---
const seedTeam: TeamMember[] = [
  { id: uuid(), name: "Samira Rao", position: "Lead Investigator", email: "samira.rao@agency.com", phone: "555-1234" },
  { id: uuid(), name: "Jordan Witt", position: "Field Agent", email: "jordan.witt@agency.com", phone: "555-4747" },
  { id: uuid(), name: "Lee Chao", position: "Analyst", email: "lee.chao@agency.com", phone: "555-3838" },
];

const seedCases: CaseItem[] = [
  { id: uuid(), slno: 1, subject: "Suspicious Package at Metro", reporterEmail: "citizen99@email.com", status: "Queued", assignments: [] },
  { id: uuid(), slno: 2, subject: "Data Breach - Hospital Records", reporterEmail: "whistle@info.org", status: "Verified", assignments: [] },
];


// --- Types ---
type TeamMember = { id: string; name: string; position: string; email: string; phone: string; };
type Assignment = { officerId: string; officerName: string; officerEmail: string; task: string; };
type CaseItem = {
  id: string;
  slno: number;
  subject: string;
  reporterEmail: string;
  status: "Queued" | "Verified" | "Re-Verification" | "Under-Review";
  assignments: Assignment[];
  reportFile?: string;
};

// --- Icon Set ---
const Icons = {
  menu: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  sentinel: <svg className="w-10 h-10" viewBox="0 0 32 32" fill="#2563eb" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="24" height="24" rx="8" /></svg>,
  history: <svg className="w-6 h-6" fill="#2563eb" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /><path d="M12 7v5l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  team: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M4 20c0-4 4-7 8-7s8 3 8 7" /></svg>,
  settings: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 012.6 2.3 1.65 1.65 0 01-2.6-2.3zM4.6 15a1.65 1.65 0 00-2.6 2.3 1.65 1.65 0 002.6-2.3z" /></svg>,
  sun: <svg className="w-6 h-6" fill="none" stroke="#F59E0B" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  moon: <svg className="w-6 h-6" fill="none" stroke="#2563EB" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 0111.21 3c0 0 3.79 2.48 6.88 7.13 3.09 4.65-2.09 2.66-2.09 2.66z" /></svg>,
};

// --- Sidebar ---
function SentinelSidebar({ expanded, onExpand, onTeam, onSettings, dark, setDark }: {
  expanded: boolean; onExpand(): void; onTeam(): void; onSettings(): void; dark: boolean; setDark(val: boolean): void,
}) {
  return (
    <aside className={`fixed top-0 left-0 h-full bg-neutral-900 border-r border-neutral-800 select-none flex flex-col z-20 transition-all duration-200 ${expanded ? "w-56" : "w-20"}`}>
      <div className="p-4 flex items-center space-x-3">
        <button onClick={onExpand} aria-label="Toggle sidebar" className="p-2 rounded hover:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:outline-none">{Icons.menu}</button>
      </div>
      <div className={`flex flex-col items-center mx-auto mb-6 transition-all duration-300 ${expanded ? "space-y-2" : "space-y-1"}`}>
        {Icons.sentinel}
        <span className={`font-bold text-blue-600 select-none ${expanded ? "text-xl" : "text-xs"}`}>SENTINEL</span>
      </div>
      <nav className="flex flex-col flex-grow space-y-1 px-2">
        <SidebarItem icon={Icons.history} label="History" expanded={expanded} active />
        <SidebarItem icon={Icons.team} label="Team" expanded={expanded} onClick={onTeam} />
        <SidebarItem icon={Icons.settings} label="Settings & Help" expanded={expanded} onClick={onSettings} />
      </nav>
      <div className="mt-auto p-4">
        <button onClick={() => setDark(!dark)} aria-label="Toggle dark mode" className="w-full flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded px-3 py-2 transition">
          {dark ? Icons.sun : Icons.moon}
          {expanded && <span className="text-sm font-medium text-white">{dark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, expanded, active, onClick }: {
  icon: React.ReactNode; label: string; expanded: boolean; active?: boolean; onClick?(): void,
}) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center space-x-3 rounded p-3 text-left transition-colors duration-150 ${active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-blue-700 hover:text-white"}`} aria-current={active ? true : undefined}>
      <span className="w-6 h-6">{icon}</span>
      {expanded && <span>{label}</span>}
    </button>
  );
}

// --- Team Modal ---
function TeamModal({ open, onClose, team, setTeam }: {
  open: boolean; onClose(): void; team: TeamMember[]; setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>,
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingData, setEditingData] = React.useState<Partial<TeamMember>>({});

  React.useEffect(() => {
    if (!open) {
      setEditingId(null);
      setEditingData({});
    }
  }, [open]);

  const startEdit = (id: string) => {
    const member = team.find(m => m.id === id);
    if (member) {
      setEditingId(id);
      setEditingData(member);
    }
  };

  const saveEdit = () => {
    if (!editingId) return;
    // minimal validation
    if (!editingData.name || !editingData.position || !editingData.email || !editingData.phone) return;
    setTeam(prev => prev.map(m => m.id === editingId ? { ...m, ...(editingData as TeamMember) } : m));
    setEditingId(null);
    setEditingData({});
  };

  const deleteMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  const addMember = () => {
    const id = uuid();
    const newMember: TeamMember = { id, name: "", position: "", email: "", phone: "" };
    setTeam(prev => [...prev, newMember]);
    setEditingId(id);
    setEditingData(newMember);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto p-6 relative">
        <button aria-label="Close" onClick={onClose} className="absolute top-2 right-2 text-white hover:text-red-500 text-3xl cursor-pointer">×</button>
        <h2 className="text-white text-2xl mb-4">Team Details</h2>
        <table className="w-full text-white text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-gray-700">Name</th>
              <th className="text-left p-2 border-b border-gray-700">Position</th>
              <th className="text-left p-2 border-b border-gray-700">Email</th>
              <th className="text-left p-2 border-b border-gray-700">Phone</th>
              <th className="p-2 border-b border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map(member => (
              <tr key={member.id} className="hover:bg-gray-800 cursor-pointer">
                {editingId === member.id ? (
                  <>
                    <td className="p-2">
                      <input className="w-full rounded bg-gray-700 p-1" value={editingData.name ?? ""} onChange={e => setEditingData(prev => ({ ...prev, name: e.target.value }))} />
                    </td>
                    <td className="p-2">
                      <input className="w-full rounded bg-gray-700 p-1" value={editingData.position ?? ""} onChange={e => setEditingData(prev => ({ ...prev, position: e.target.value }))} />
                    </td>
                    <td className="p-2">
                      <input className="w-full rounded bg-gray-700 p-1" type="email" value={editingData.email ?? ""} onChange={e => setEditingData(prev => ({ ...prev, email: e.target.value }))} />
                    </td>
                    <td className="p-2">
                      <input className="w-full rounded bg-gray-700 p-1" value={editingData.phone ?? ""} onChange={e => setEditingData(prev => ({ ...prev, phone: e.target.value }))} />
                    </td>
                    <td className="p-2 flex space-x-2 justify-end">
                      <button onClick={saveEdit} className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700">Save</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{member.name}</td>
                    <td className="p-2">{member.position}</td>
                    <td className="p-2">{member.email}</td>
                    <td className="p-2">{member.phone}</td>
                    <td className="p-2 flex space-x-2 justify-end">
                      <button onClick={() => startEdit(member.id)} className="text-blue-500 hover:underline">Edit</button>
                      <button onClick={() => deleteMember(member.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-right">
          <button onClick={addMember} className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">
            + Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Assign Dropdown ---
function AssignDropdown({ caseItem, team, onAssign, onHide }: {
  caseItem: CaseItem; team: TeamMember[]; onAssign(assignment: Assignment): void; onHide(): void;
}) {
  const assignedIds = caseItem.assignments.map(a => a.officerId);
  const available = team.filter(m => !assignedIds.includes(m.id));
  const [tasks, setTasks] = useState<Record<string, string>>({});

  return (
    <div className="absolute z-30 left-0 mt-1 w-80 max-h-96 overflow-auto rounded-lg bg-neutral-800 p-4 shadow-lg">
      <div className="mb-3 font-semibold text-white">Assign Officers</div>
      {caseItem.assignments.length > 0 && (
        <div className="mb-3">
          {caseItem.assignments.map((assignment, idx) => (
            <div key={assignment.officerId} className="text-gray-300 text-sm mb-1 flex items-center gap-2 truncate">
              • <span className="font-semibold">{assignment.officerName}</span>: <span className="italic truncate">{assignment.task}</span> <span className="ml-auto text-xs text-gray-400">{assignment.officerEmail}</span>
            </div>
          ))}
        </div>
      )}
      {available.map(member => (
        <div key={member.id} className="flex items-center gap-2 mb-2">
          <button aria-label={`Assign task to ${member.name}`} className="bg-blue-600 text-white rounded p-1 font-bold w-6 h-6 flex items-center justify-center" onClick={() => {
            if (!tasks[member.id] || !tasks[member.id].trim()) return;
            onAssign({ officerId: member.id, officerName: member.name, officerEmail: member.email, task: tasks[member.id] });
            alert(`Assigned ${member.name} with task:\n${tasks[member.id]}`);
            setTasks(prev => ({ ...prev, [member.id]: "" }));
          }}>+</button>
          <div className="flex-grow truncate">{member.name}</div>
          <input type="text" placeholder="Task" value={tasks[member.id] || ""} onChange={e => setTasks(prev => ({ ...prev, [member.id]: e.target.value }))} className="w-28 text-sm rounded px-2 py-1 bg-neutral-700 text-white border border-neutral-600 focus:outline-none" />
        </div>
      ))}
      <div className="text-right">
        <button onClick={onHide} className="text-sm px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600">Close</button>
      </div>
    </div>
  );
}

// --- Settings Modal ---
const settingsList = [
  { key: "feedback", label: "Feedback" },
  { key: "general", label: "General" },
  { key: "notifications", label: "Notifications" },
  { key: "personalization", label: "Personalization" },
  { key: "datacontrols", label: "Data controls" },
  { key: "security", label: "Security" },
];

function SettingsModal({
  open,
  onClose,
  section,
  setSection,
  dark,
  setDark,
  notifications,
  setNotifications,
}: {
  open: boolean;
  onClose(): void;
  section: string;
  setSection(s: string): void;
  dark: boolean;
  setDark(b: boolean): void;
  notifications: boolean;
  setNotifications(b: boolean): void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (open) {
      const handle = (e: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      };
      window.addEventListener("mousedown", handle);
      return () => window.removeEventListener("mousedown", handle);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center p-4">
      <div ref={modalRef} className="bg-neutral-900 text-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto flex flex-row">
        <button aria-label="Close" onClick={onClose} className="absolute top-4 left-4 text-white text-2xl cursor-pointer hover:text-red-500 select-none">×</button>
        <nav className="w-60 border-r border-gray-700 p-6 pt-16 flex flex-col space-y-3 overflow-auto">
          {settingsList.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full text-left px-3 py-2 rounded ${
                section === item.key
                  ? "bg-blue-600 font-semibold"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <main className="flex-grow p-6 overflow-auto pt-16">
          {section === "feedback" && (
            <>
              <h2 className="text-2xl font-semibold mb-5">Feedback</h2>
              <p className="mb-5 text-gray-300">
                We appreciate your feedback! Click below to submit.
              </p>
              <button className="bg-blue-600 px-5 py-2 rounded hover:bg-blue-700" onClick={() => { window.location.href = "/feedback"; }}>
                Submit Feedback
              </button>
            </>
          )}
          {section === "general" && (
            <>
              <h2 className="text-2xl font-semibold mb-5">General Settings</h2>
              <div className="flex items-center justify-between max-w-xs">
                <span>Theme</span>
                <select value={dark ? "dark" : "light"} onChange={e => setDark(e.target.value === "dark")} className="bg-neutral-800 text-white rounded px-3 py-1">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </>
          )}
          {section === "notifications" && (
            <>
              <h2 className="text-2xl font-semibold mb-5">Notifications</h2>
              <label className="flex items-center space-x-3 max-w-xs">
                <span>Enable Notifications</span>
                <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="w-6 h-6 rounded border-gray-500" />
              </label>
            </>
          )}
          {section === "personalization" && (
            <>
              <h2 className="text-2xl font-semibold mb-5">Personalization</h2>
              <p>Coming soon...</p>
            </>
          )}
          {section === "datacontrols" && (
            <>
              <h2 className="text-2xl font-semibold mb-5">Data Controls</h2>
              <ul className="space-y-4 text-gray-300 max-w-lg">
                <li className="flex justify-between items-center">
                  <span>Improve the model for everyone</span>
                  <span className="bg-blue-600 rounded-full px-3 py-1">On</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>Shared links</span>
                  <button className="bg-gray-700 rounded px-3 py-1 hover:bg-gray-600">Manage</button>
                </li>
                <li className="flex justify-between items-center">
                  <span>Archived reports</span>
                  <button className="bg-gray-700 rounded px-3 py-1 hover:bg-gray-600">Manage</button>
                </li>
                <li className="flex justify-between items-center">
                  <span>Archive all</span>
                  <button className="bg-gray-700 rounded px-3 py-1 hover:bg-gray-600">Archive All</button>
                </li>
                <li className="flex justify-between items-center">
                  <span>Delete all</span>
                  <button className="bg-red-600 text-white rounded px-3 py-1 hover:bg-red-700">Delete All</button>
                </li>
                <li className="flex justify-between items-center">
                  <span>Export</span>
                  <button className="bg-gray-700 rounded px-3 py-1 hover:bg-gray-600">Export</button>
                </li>
              </ul>
            </>
          )}
          {section === "security" && (
            <>
              <h2 className="text-2xl font-semibold mb-5">Security</h2>
              <ul className="space-y-4 text-gray-300 max-w-lg">
                <li className="flex justify-between items-center">
                  <span>Multi-factor Authentication</span>
                  <input type="checkbox" className="w-6 h-6 rounded border-gray-500" />
                </li>
                <li className="flex justify-between items-center">
                  <span>Log out of this device</span>
                  <button className="bg-gray-700 rounded px-3 py-1 hover:bg-gray-600">Log Out</button>
                </li>
                <li className="flex justify-between items-center">
                  <span>Log out of all devices</span>
                  <button className="bg-red-600 text-white rounded px-3 py-1 hover:bg-red-700">Log Out All</button>
                </li>
              </ul>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const MenuButton = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => (
    <button onClick={onClick} className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 text-gray-300">
        {children}
    </button>
);

const SettingsHelpPopover = ({ open, anchorRef, onClose, dark, setDark, setSection }: any) => {
    if (!open) return null;
    return (
        <div ref={anchorRef} className="absolute z-40 right-4 bottom-16 bg-neutral-800 rounded-lg shadow-xl p-4 w-64 text-white">
            <h3 className="font-bold mb-2">Settings & Help</h3>
            <MenuButton onClick={() => setSection('general')}>General</MenuButton>
            <MenuButton onClick={() => setSection('security')}>Security</MenuButton>
            <MenuButton onClick={() => setSection('notifications')}>Notifications</MenuButton>
            <div className="mt-2 pt-2 border-t border-gray-700">
                <label className="flex items-center justify-between w-full text-sm">
                    <span>Dark Mode</span>
                    <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} />
                </label>
            </div>
        </div>
    );
};

export default function SentinelDashboardPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [dark, setDark] = useState(() => getLS(DARK_KEY, true));
  const [notifications, setNotifications] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>(() => getLS(TEAM_KEY, seedTeam));
  const [cases, setCases] = useState<CaseItem[]>(() => getLS(CASES_KEY, seedCases));
  const [slno, setSlno] = useState(() => cases.length ? Math.max(...cases.map(c => c.slno)) + 1 : seedCases.length + 1);
  const [teamModal, setTeamModal] = useState(false);
  const [assignShow, setAssignShow] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("general");
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLDivElement | null>(null);


  // Sync theme with html class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    setLS(DARK_KEY, dark);
  }, [dark]);

  // Sync team and cases to localStorage
  useEffect(() => {
    setLS(TEAM_KEY, team);
  }, [team]);
  useEffect(() => {
    setLS(CASES_KEY, cases);
  }, [cases]);

  // Simulate new incoming cases every 20s
  useEffect(() => {
    const interval = setInterval(() => {
      const picks = ["Misinformation on Public Health", "Bogus Viral Video", "Harassment Report", "Cloned Social Media Account"];
      const emails = ["tipster@protonmail.com", "anon@report.org", "civic.user@yahoo.com", "fakeaccount@ymail.com"];
      const index = Math.floor(Math.random() * picks.length);
      setCases(prev => [...prev, {
        id: uuid(),
        slno,
        subject: picks[index],
        reporterEmail: emails[index],
        status: "Queued",
        assignments: []
      }]);
      setSlno(s => s + 1);
    }, 20000);
    return () => clearInterval(interval);
  }, [slno]);

  const openTeam = () => setTeamModal(true);
  const closeTeam = () => setTeamModal(false);

  const openSettings = () => {
    setSettingsSection("general");
    setSettingsOpen(true);
  };
  const closeSettings = () => setSettingsOpen(false);

  const handleSettingsClick = (event: React.MouseEvent<HTMLDivElement>) => {
      setSettingsAnchor(settingsAnchor ? null : event.currentTarget);
      setSettingsOpen(!settingsOpen);
  };


  return (
    <SidebarProvider>
    <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans">
      <SentinelSidebar
        expanded={sidebarExpanded}
        onExpand={() => setSidebarExpanded(e => !e)}
        onTeam={() => setTeamModal(true)}
        onSettings={openSettings}
        dark={dark}
        setDark={setDark}
      />
      <SettingsModal open={settingsOpen} onClose={closeSettings} section={settingsSection} setSection={setSettingsSection} dark={dark} setDark={setDark} notifications={notifications} setNotifications={setNotifications} />
      {teamModal && <TeamModal open={teamModal} onClose={closeTeam} team={team} setTeam={setTeam} />}
      <div className={`ml-${sidebarExpanded ? 56 : 20} transition-all duration-300 flex-1 min-h-screen p-6`}>
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">Case History</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Incoming reports are listed below and updated live.</p>
        <div className="overflow-x-auto rounded-lg shadow ring-1 ring-black ring-opacity-5 bg-white dark:bg-gray-800">
          <table className="w-full border-collapse text-gray-900 dark:text-white">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="p-3 text-left font-semibold">Sl. No.</th>
                <th className="p-3 text-left font-semibold">Case Subject</th>
                <th className="p-3 text-left font-semibold">Reporter Email</th>
                <th className="p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-gray-500 dark:text-gray-400">No cases to display.</td>
                </tr>
              )}
              {cases.map((c, i) => (
                <tr key={c.id} className={`border-t border-gray-200 dark:border-gray-700 ${i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-gray-800"}`}>
                  <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">{c.slno}</td>
                  <td className="p-3">{c.subject}</td>
                  <td className="p-3">
                    <button className="text-blue-600 dark:text-blue-400 underline" onClick={() => window.open(`mailto:${c.reporterEmail}`)}>Email</button>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{c.reporterEmail}</div>
                  </td>
                  <td className="p-3 space-y-2 md:space-y-0 md:flex md:items-center md:space-x-3 relative">
                     <button
                        className="bg-blue-600 hover:bg-blue-700 text-white p-1 px-3 rounded text-sm"
                        onClick={() => setAssignShow(assignShow === c.id ? null : c.id)}
                        >
                        Assign Officers
                    </button>
                    {assignShow === c.id && (
                        <AssignDropdown
                            caseItem={c}
                            team={team}
                            onAssign={assignment => {
                                setCases(cs => cs.map(item => item.id === c.id ? { ...item, assignments: [...item.assignments, assignment] } : item));
                                setAssignShow(null);
                            }}
                            onHide={() => setAssignShow(null)}
                        />
                    )}
                    <select className="border rounded p-1 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                      value={c.status}
                      onChange={e => {
                        const val = e.target.value as "Queued" | "Verified" | "Re-Verification" | "Under-Review";
                        setCases(prev => prev.map(item => item.id === c.id ? { ...item, status: val } : item));
                      }}
                    >
                      {["Queued", "Verified", "Re-Verification", "Under-Review"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <FileUploadButton caseItem={c} setCases={setCases} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Modal Component */}
      {teamModal && <TeamModal open={teamModal} onClose={closeTeam} team={team} setTeam={setTeam} />}
    </div>
    </SidebarProvider>
  );
}

// AssignButton component helper
function AssignButton({
  caseId,
  assignShow,
  setAssignShow,
}: {
  caseId: string;
  assignShow: string | null;
  setAssignShow: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white p-1 px-3 rounded text-sm"
      onClick={() => setAssignShow(assignShow === caseId ? null : caseId)}
    >
      Assign Officers
    </button>
  );
}

// FileUploadButton component helper
function FileUploadButton({ caseItem, setCases }: {
  caseItem: CaseItem;
  setCases: React.Dispatch<React.SetStateAction<CaseItem[]>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        setCases(prev => prev.map(c => c.id === caseItem.id ? { ...c, reportFile: fileContent } : c));
        alert(`File "${file.name}" uploaded for case #${caseItem.slno}`);
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        className="bg-gray-600 hover:bg-gray-700 text-white p-1 px-3 rounded text-sm"
        onClick={() => fileInputRef.current?.click()}
      >
        {caseItem.reportFile ? "View Report" : "Upload Report"}
      </button>
    </>
  );
}
