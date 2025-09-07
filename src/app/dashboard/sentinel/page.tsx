"use client";
import React, { useState, useEffect } from "react";

type TeamMember = {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
};
type Assignment = {
  officerId: string;
  officerName: string;
  officerEmail: string;
  task: string;
};
type CaseStatus = "Queued" | "Verified" | "Re-Verification" | "Under-Review";
type CaseItem = {
  id: string;
  slno: number;
  subject: string;
  reporterEmail: string;
  status: CaseStatus;
  assignments: Assignment[];
  reportFile?: string;
};

const TEAM_KEY = "sentinel_team2";
const CASES_KEY = "sentinel_cases2";
const DARK_KEY = "sentinel_dark2";
function uuid() { return Math.random().toString(36).slice(2, 14); }
function getLS<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;
  const val = localStorage.getItem(key);
  return val ? (JSON.parse(val) as T) : fallback;
}
function setLS<T>(key: string, val: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(val));
}

const seedTeam: TeamMember[] = [
  { id: uuid(), name: "Samira Rao", position: "Lead Investigator", email: "samira.rao@agency.com", phone: "555-1234" },
  { id: uuid(), name: "Jordan Witt", position: "Field Agent", email: "jordan.witt@agency.com", phone: "555-4747" },
  { id: uuid(), name: "Lee Chao", position: "Analyst", email: "lee.chao@agency.com", phone: "555-3838" },
];
const seedCases: CaseItem[] = [
  { id: uuid(), slno: 1, subject: "Suspicious Package at Metro", reporterEmail: "citizen99@email.com", status: "Queued", assignments: [] },
  { id: uuid(), slno: 2, subject: "Data Breach - Hospital Records", reporterEmail: "whistle@info.org", status: "Verified", assignments: [] },
];

const navIcons = {
  menu: (
    <svg width={28} height={28} viewBox="0 0 24 24" className="inline"><rect y="4" width="24" height="2" rx="1" fill="currentColor"/><rect y="11" width="24" height="2" rx="1" fill="currentColor"/><rect y="18" width="24" height="2" rx="1" fill="currentColor"/></svg>
  ),
  square: (
    <svg width={40} height={40} className="block" viewBox="0 0 32 32"><rect x={4} y={4} width={24} height={24} rx={8} fill="#2563eb" /></svg>
  ),
  history: (
    <svg width={28} height={28} stroke="none" fill="currentColor" viewBox="0 0 24 24"><circle cx={12} cy={12} r={9} fill="#2563eb"/><path d="M12 7v5l4 2" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  team: (
    <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M4 20c0-4 4-7 8-7s8 3 8 7" /></svg>
  ),
  settings: (
    <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15A1.65 1.65 0 0122 17.1v2.14A2 2 0 0120 21a1.65 1.65 0 01-2.27-.6M4.6 15A1.65 1.65 0 012 17.1v2.14A2 2 0 004 21a1.65 1.65 0 002.27-.6" /></svg>
  ),
  sun: (
    <svg width={26} height={26} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#f59e42"/><g stroke="#f59e42" strokeWidth={2}><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></g></svg>
  ),
  moon: (
    <svg width={26} height={26} fill="none" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 0111.21 3 7 7 0 0012 21a9 9 0 009-8.21z" fill="#2563eb"/></svg>
  ),
};

function Sidebar({
  expanded, onExpand, onTeam, onSettings, dark, setDark,
}: {
  expanded: boolean; onExpand: () => void; onTeam: () => void; onSettings: () => void;
  dark: boolean; setDark: (d: boolean) => void;
}) {
  return (
    <aside className={`flex flex-col h-screen fixed z-20 transition-all duration-200 bg-neutral-950 dark:bg-black border-r border-neutral-800 select-none 
      ${expanded ? "w-56" : "w-20 sm:w-24"}
    `}>
      {/* Hamburger */}
      <div className="flex items-center gap-2 px-3 py-4 relative">
        <button aria-label="Expand sidebar" className="p-2 rounded hover:bg-neutral-800 focus:bg-neutral-800" onClick={onExpand}>
          {navIcons.menu}
        </button>
      </div>
      {/* Gemini blue square logo + SENTINEL */}
      <div className={`flex flex-col transition-all items-center ${expanded ? "mt-1 mb-5" : "mt-3 mb-1"}`}>
        {navIcons.square}
        <span className={`block font-bold mt-1 text-blue-600 tracking-tighter transition-all duration-150
          ${expanded ? "text-base" : "text-xs"}
        `}>
          SENTINEL
        </span>
      </div>
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        <SidebarItem
          icon={navIcons.history}
          label="History"
          expanded={expanded}
          active
        />
        <SidebarItem
          icon={navIcons.team}
          label="Team"
          expanded={expanded}
          onClick={onTeam}
        />
        <SidebarItem
          icon={navIcons.settings}
          label="Settings & Help"
          expanded={expanded}
          onClick={onSettings}
        />
      </nav>
      {/* Dark / Light mode toggle at bottom */}
      <button
        aria-label="Switch dark/light mode"
        className={`flex items-center gap-2 px-4 py-3 w-full hover:bg-neutral-800/50 group transition-colors 
        ${expanded ? "justify-start" : "justify-center px-0"}
        `}
        onClick={() => setDark(!dark)}
      >
        <span className="text-lg">
          {dark ? navIcons.sun : navIcons.moon}
        </span>
        <span className={`text-sm text-neutral-200 font-medium transition-all ${expanded ? "block" : "hidden"}`}>
          {dark ? "Light Mode" : "Dark Mode"}
        </span>
      </button>
    </aside>
  );
}

function SidebarItem({
  icon, label, expanded, onClick, active = false,
}: {
  icon: React.ReactNode; label: string; expanded: boolean; onClick?: () => void; active?: boolean;
}) {
  return (
    <button
      className={`
        flex items-center w-full gap-3 px-4 py-3 rounded
        ${expanded ? "justify-start" : "justify-center"}
        ${active ? "bg-blue-900/60" : "hover:bg-neutral-800"}
        text-neutral-200 font-medium
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-all
      `}
      aria-label={label}
      onClick={onClick}
      tabIndex={0}
    >
      <span className="text-xl">{icon}</span>
      <span className={`ml-2 ${expanded ? "block" : "hidden"} text-sm`}>{label}</span>
    </button>
  );
}

/* Team modal, Assign dropdown and main content logic are identical to prior version.
   Only change: the sidebar structure with collapse/expand and darkmode toggle at bottom.
   Rest of the dashboard is unchanged except sidebar behavior.
*/

function TeamModal({ open, onClose, team, setTeam }: { open: boolean; onClose: () => void; team: TeamMember[]; setTeam: (tm: TeamMember[]) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<TeamMember>>({});
  useEffect(() => { if (!open) setEditing(null); }, [open]);
  function startEdit(id: string) {
    const m = team.find((x) => x.id === id);
    setFields({ ...m });
    setEditing(id);
  }
  function saveEdit(id: string) {
    if (!fields.name || !fields.email || !fields.position || !fields.phone) return;
    const idx = team.findIndex((x) => x.id === id);
    if (idx >= 0) {
      const updated = [...team];
      updated[idx] = { ...updated[idx], ...fields as TeamMember };
      setTeam(updated);
      setLS(TEAM_KEY, updated);
    }
    setEditing(null);
  }
  function deleteMember(id: string) {
    const updated = team.filter((x) => x.id !== id);
    setTeam(updated);
    setLS(TEAM_KEY, updated);
  }
  function addMember() {
    const id = uuid();
    setTeam([...team, { id, name: "", position: "", email: "", phone: "" }]);
    setEditing(id);
    setFields({ id, name: "", position: "", email: "", phone: "" });
  }
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-75">
      <div className="bg-neutral-950 dark:bg-black border border-neutral-900 rounded-xl w-full max-w-2xl mx-2 shadow-2xl animate-fadeIn">
        <div className="flex justify-between items-center px-5 py-3 border-b border-neutral-700">
          <span className="text-lg font-bold text-white tracking-wide">Team Details</span>
          <button className="text-neutral-400 hover:text-white text-2xl px-2" aria-label="Close team" onClick={onClose}>×</button>
        </div>
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-left text-neutral-200 font-semibold">
            <thead>
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Position</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {team.map((m, idx) => editing === m.id ? (
                <tr key={m.id} className="bg-neutral-900">
                  <td className="px-3 py-2">
                    <input required className="w-full rounded bg-neutral-800 text-white p-1" value={fields.name ?? ""} placeholder="Name" onChange={e => setFields(f => ({ ...f, name: e.target.value }))} />
                  </td>
                  <td className="px-3 py-2">
                    <input required className="w-full rounded bg-neutral-800 text-white p-1" value={fields.position ?? ""} placeholder="Position" onChange={e => setFields(f => ({ ...f, position: e.target.value }))} />
                  </td>
                  <td className="px-3 py-2">
                    <input required className="w-full rounded bg-neutral-800 text-white p-1" value={fields.email ?? ""} placeholder="Email" type="email" onChange={e => setFields(f => ({ ...f, email: e.target.value }))} />
                  </td>
                  <td className="px-3 py-2">
                    <input required className="w-full rounded bg-neutral-800 text-white p-1" value={fields.phone ?? ""} placeholder="Phone" onChange={e => setFields(f => ({ ...f, phone: e.target.value }))} />
                  </td>
                  <td className="px-1 py-1 text-right">
                    <button className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 font-bold" onClick={() => saveEdit(m.id)}>Save</button>
                  </td>
                </tr>
              ) : (
                <tr key={m.id} className="hover:bg-neutral-900">
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2">{m.position}</td>
                  <td className="px-3 py-2">{m.email}</td>
                  <td className="px-3 py-2">{m.phone}</td>
                  <td className="px-2 py-1 text-right">
                    <button className="text-blue-400 hover:underline mr-2" onClick={() => startEdit(m.id)}>Edit</button>
                    <button className="text-red-400 hover:text-red-500" onClick={() => deleteMember(m.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="py-4 px-6 text-right">
            <button className="bg-green-600 px-4 py-2 rounded text-white font-bold hover:bg-green-700 flex items-center gap-2" onClick={addMember}>
              <span className="text-2xl leading-5">+</span>
              <span>Add member</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}


function AssignDropdown({ caseItem, team, onAssign, onHide }: { caseItem: CaseItem; team: TeamMember[]; onAssign: (a: Assignment) => void; onHide: () => void; }) {
  const assignedIds = caseItem.assignments.map(a => a.officerId);
  const available = team.filter(m => !assignedIds.includes(m.id));
  const [tasks, setTasks] = useState<Record<string, string>>({});
  return (
    <div className="absolute left-0 z-30 mt-1 min-w-[310px] max-h-96 overflow-auto bg-neutral-950 dark:bg-black text-white border border-neutral-800 rounded-xl shadow-lg animate-fadeIn px-4 py-3">
      <div className="font-semibold mb-2">Assign Officers</div>
      {caseItem.assignments.length > 0 && (
        <div className="mb-2">
          {caseItem.assignments.map((a, i) => (
            <div key={a.officerId} className="flex items-center mb-1 text-neutral-200 pl-3 text-sm">
              <span className="mr-2">•</span>
              <span className="font-bold">{a.officerName}</span>
              <span className="mx-2 italic text-neutral-400">{a.task}</span>
              <span className="ml-2 text-neutral-500 text-xs">{a.officerEmail}</span>
            </div>
          ))}
        </div>
      )}
      {available.map((m) => (
        <div key={m.id} className="flex gap-1 items-center mb-2">
          <button className="bg-blue-500 rounded-full text-white w-5 h-5 flex items-center justify-center font-extrabold" onClick={() => {
            if (!(tasks[m.id] && tasks[m.id].trim())) return;
            onAssign({
              officerId: m.id,
              officerName: m.name,
              officerEmail: m.email,
              task: tasks[m.id],
            });
            window.alert(`Email sent to ${m.email}:\nTask: ${tasks[m.id]}`);
            setTasks(prev => ({ ...prev, [m.id]: "" }));
          }}>+</button>
          <span className="flex-1 font-medium ml-1">{m.name}</span>
          <span className="mx-2 text-neutral-400 text-xs">{m.email}</span>
          <input className="rounded border border-neutral-700 p-1 bg-neutral-800 text-white text-xs w-28" placeholder="Task" value={tasks[m.id] ?? ""} onChange={e => setTasks(prev => ({ ...prev, [m.id]: e.target.value }))} />
        </div>
      ))}
      <div className="flex justify-end">
        <button className="mt-2 border px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs" onClick={onHide}>Close</button>
      </div>
    </div>
  );
}

export default function SentinelDashboardPage() {
  // --- Sidebar state, theme state ---
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [dark, setDark] = useState(() => !!getLS(DARK_KEY, true));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", Boolean(dark));
    setLS(DARK_KEY, dark);
  }, [dark]);
  // --- Team and cases ---
  const [team, setTeam] = useState<TeamMember[]>(() => getLS(TEAM_KEY, seedTeam));
  useEffect(() => setLS(TEAM_KEY, team), [team]);
  const [cases, setCases] = useState<CaseItem[]>(() => getLS(CASES_KEY, seedCases));
  const [slno, setSlno] = useState(() => cases.length ? Math.max(...cases.map(c => c.slno)) + 1 : 3);
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

  function teamOpen() { setTeamModal(true); }
  function settingsOpen() {
    window.alert("Redirect to settings/help (combined)");
  }

  // Case actions as before
  function handleAssign(caseId: string, ass: Assignment) {
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, assignments: [...c.assignments, ass] }));
  }
  function handleStatus(caseId: string, status: CaseStatus) {
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, status }));
  }
  function handleReport(caseId: string, files: FileList | null) {
    if (!files || !files[0]) return;
    setCases(prev => prev.map(c => c.id !== caseId ? c : { ...c, reportFile: files[0].name }));
  }

  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans">
      <Sidebar
        expanded={sidebarExpanded}
        onExpand={() => setSidebarExpanded(e => !e)}
        onTeam={teamOpen}
        onSettings={settingsOpen}
        dark={dark}
        setDark={setDark}
      />
      {/* Main Content */}
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
                          {/* Assign Officers */}
                          <div className="relative inline-block">
                            <button className="px-3 py-1 text-xs rounded bg-blue-700 hover:bg-blue-800 text-white shadow font-bold" aria-label="Assign officers" onClick={() => setAssignShow(c.id)}>Assign Officers</button>
                            {assignShow === c.id && (
                              <AssignDropdown
                                key={c.id}
                                team={team}
                                caseItem={c}
                                onAssign={ass => handleAssign(c.id, ass)}
                                onHide={() => setAssignShow(null)}
                              />
                            )}
                          </div>
                          {/* Status */}
                          <select aria-label="Update Action"
                            className="px-3 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold"
                            value={c.status}
                            onChange={e => handleStatus(c.id, e.target.value as CaseStatus)}
                          >
                            <option>Queued</option>
                            <option>Verified</option>
                            <option>Re-Verification</option>
                            <option>Under-Review</option>
                          </select>
                          {/* Upload */}
                          <label className="px-3 py-1 bg-neutral-300 dark:bg-neutral-800 rounded text-xs font-semibold cursor-pointer text-neutral-800 dark:text-neutral-100">
                            <input hidden type="file" aria-label="Upload report" onChange={e => handleReport(c.id, e.target.files)} />
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
  );
}

/**
 * Gemini-inspired:
 * - Collapsible sidebar w/ hamburger, blue square logo, "SENTINEL", always all icons.
 * - On expand, labels appear; on collapse, just icons.
 * - Dark/light toggle always at bottom with correct accessibility.
 * - Settings/help single gear icon, one action.
 * - All contrast/focus correct in both modes.
 * - Main dashboard unchanged.
 */
