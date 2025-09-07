
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
  expanded, onExpand, onTeam, onOpenSettings, dark,
  setDark,
}: {
  expanded: boolean; onExpand: () => void; onTeam: () => void;
  onOpenSettings: (anchor: HTMLElement | null) => void;
  dark: boolean; setDark: (d: boolean) => void;
}) {
  return (
    <aside className={`flex flex-col h-screen fixed z-20 transition-all duration-200 bg-neutral-950 dark:bg-black border-r border-neutral-800 select-none 
      ${expanded ? "w-56" : "w-20 sm:w-24"}
    `}>
      <div className="flex items-center gap-2 px-3 py-4 relative">
        <button aria-label="Expand sidebar" className="p-2 rounded hover:bg-neutral-800 focus:bg-neutral-800" onClick={onExpand}>
          {navIcons.menu}
        </button>
      </div>
      <div className={`flex flex-col transition-all items-center ${expanded ? "mt-1 mb-5" : "mt-3 mb-1"}`}>
        {navIcons.square}
        <span className={`block font-bold mt-1 text-blue-600 tracking-tighter transition-all duration-150 ${expanded ? "text-base" : "text-xs"}`}>
          SENTINEL
        </span>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        <SidebarItem icon={navIcons.history} label="History" expanded={expanded} active />
        <SidebarItem icon={navIcons.team} label="Team" expanded={expanded} onClick={onTeam} />
        <SidebarItem icon={navIcons.settings} label="Settings & Help" expanded={expanded}
          onClick={e => onOpenSettings(e.currentTarget)} />
      </nav>
      <button
        aria-label="Switch dark/light mode"
        className={`flex items-center gap-2 px-4 py-3 w-full hover:bg-neutral-800/50 group transition-colors 
        ${expanded ? "justify-start" : "justify-center px-0"}`}
        onClick={() => setDark(!dark)}
      >
        <span className="text-lg">{dark ? navIcons.sun : navIcons.moon}</span>
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
  icon: React.ReactNode; label: string; expanded: boolean; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; active?: boolean;
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

function SettingsHelpPopover({
  open, anchorRef, onClose, dark, setDark
}: {
  open: boolean;
  anchorRef: HTMLElement | null;
  onClose: () => void;
  dark: boolean;
  setDark: (d: boolean) => void;
}) {
  const [openTheme, setOpenTheme] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  useEffect(() => {
    if (open) setOpenTheme(false), setOpenHelp(false);
    function handle(e: MouseEvent) {
      if (anchorRef && !anchorRef.contains(e.target as Node) && !(e.target as HTMLElement).closest(".settings-popover"))
        onClose();
    }
    if (open) window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open, anchorRef, onClose]);
  if (!open || !anchorRef) return null;
  return (
    <div style={{
      position: "fixed",
      top: anchorRef.getBoundingClientRect().bottom + 4 + window.scrollY,
      left: anchorRef.getBoundingClientRect().left + (anchorRef.offsetWidth / 2) - 180,
      zIndex: 1002,
      minWidth: 360
    }}
      className="settings-popover animate-fadeIn"
    >
      <div className="bg-neutral-900 text-white dark:bg-black rounded-xl shadow-2xl px-2 py-2 ring-1 ring-neutral-800 w-[360px]">
        <MenuButton icon={
          <svg width={22} height={22} className="inline"><path d="M12 2a10 10 0 110 20 10 10 0 010-20zm0 4v4l3 1" fill="none" stroke="currentColor" strokeWidth={2} /></svg>
        } label="Theme" onClick={() => setOpenTheme(o => !o)} selected={openTheme} />
        {openTheme && (
          <div className="ml-8 py-1">
            <button className={`block w-full text-left px-3 py-2 rounded ${dark ? "bg-neutral-800 text-blue-300" : "hover:bg-neutral-800/80"} transition`} onClick={() => setDark(true)}>
              Dark theme
            </button>
            <button className={`block w-full text-left px-3 py-2 rounded ${!dark ? "bg-neutral-100 text-blue-600" : "hover:bg-neutral-800/80"} transition`} onClick={() => setDark(false)}>
              Light theme
            </button>
          </div>
        )}
        <MenuButton icon={
          <svg width={22} height={22} className="inline"><path d="M10.2 13.8l5.6-5.6" stroke="currentColor" strokeWidth={2.2} /><circle cx={8.5} cy={15.5} r={1.5} fill="currentColor" /><circle cx={15.5} cy={8.5} r={1.5} fill="currentColor" /></svg>
        } label="Send feedback" onClick={() => window.alert("Feedback form coming soon!")} />
        <MenuButton icon={
          <svg width={22} height={22} className="inline"><rect width={14} height={14} x={4} y={4} rx={2} fill="none" stroke="currentColor" strokeWidth={2} /><path d="M8 10h4M8 14h8" stroke="currentColor" strokeWidth={2} /></svg>
        } label="Help" onClick={() => setOpenHelp(o => !o)} selected={openHelp} />
        {openHelp && (
          <div className="ml-8 py-1">
            <button className="block w-full text-left px-3 py-2 rounded hover:bg-neutral-800/80" onClick={() => window.location.href = "/about"}>Help Center</button>
            <button className="block w-full text-left px-3 py-2 rounded hover:bg-neutral-800/80" onClick={() => window.location.href = "/about"}>Privacy</button>
          </div>
        )}
      </div>
    </div>
  );
}
function MenuButton({ icon, label, onClick, selected = false }: { icon: React.ReactNode; label: string; onClick: () => void; selected?: boolean }) {
  return (
    <button className={`flex items-center w-full text-left px-3 py-2 gap-3 rounded text-md hover:bg-neutral-800/80 transition ${selected ? "bg-neutral-800 text-blue-300" : ""}`} onClick={onClick}>
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
      <span className="flex-1" />
      {(label === "Theme" || label === "Help") && (
        <svg width={22} height={22} className={`inline ml-2 rotate-90 transition-transform ${selected ? "rotate-0" : ""}`}>
          <polyline points="9 7 13 11 9 15" fill="none" stroke="currentColor" strokeWidth={2.2} />
        </svg>
      )}
    </button>
  );
}

export default function SentinelDashboardPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [dark, setDark] = useState(() => !!getLS(DARK_KEY, true));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);

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

  const handleOpenSettings = (anchor: HTMLElement | null) => {
    setSettingsAnchor(anchor);
    setSettingsOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans">
      <Sidebar
        expanded={sidebarExpanded}
        onExpand={() => setSidebarExpanded(e => !e)}
        onTeam={() => setTeamModal(true)}
        onOpenSettings={handleOpenSettings}
        dark={dark}
        setDark={setDark}
      />
      <SettingsHelpPopover
        open={settingsOpen}
        anchorRef={settingsAnchor}
        onClose={() => setSettingsOpen(false)}
        dark={dark}
        setDark={setDark}
      />
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
  );
}
