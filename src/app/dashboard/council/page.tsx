// page.tsx

"use client";
import React, { useState } from "react";
import {
  Menu as MenuIcon,
  Users,
  List,
  Settings,
  HelpCircle,
  FileText,
  ChevronDown,
  X,
  Moon,
  Sun,
  Bell,
  Shield,
  Database,
  User,
} from "lucide-react";

// ---- Theme colors and constants ----
const DARK = {
  sidebarBg: "#24282F",
  sidebarFg: "#F3F4F7",
  accent: "#4F46E5",
  accentHighlight: "#6366F1",
  accentSidebar: "#3B82F6",
  mainBg: "#181A20",
  cardBg: "#26292F",
  border: "#28304A",
  faded: "#7681A3",
  hover: "#21252B",
  popupBg: "#23262C",
  shadow: "0 6px 32px rgba(20,30,60,0.24)",
  navActive: "#23262C",
};
const LIGHT = {
  sidebarBg: "#F9F9FA",
  sidebarFg: "#27324A",
  accent: "#4F46E5",
  accentHighlight: "#6366F1",
  accentSidebar: "#3B82F6",
  mainBg: "#F7F7FA",
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
  faded: "#8391A8",
  hover: "#E1E6F9",
  popupBg: "#FFF",
  shadow: "0 8px 32px rgba(100,120,180,0.15)",
  navActive: "#ECEFF7",
};
const CHATGPT_FONT = "'Segoe UI','Inter UI','Arial','sans-serif'";
const GEMINI_FONT = "'Poppins','Segoe UI','Arial','sans-serif'";

// Agency Data
const AGENCY_MEMBERS = [
  {
    name: "Priya S.",
    email: "priya.s@agency.gov.in",
    position: "Inspector",
    body: "Municipal Works",
  },
  {
    name: "Ajay R.",
    email: "ajay.r@agency.gov.in",
    position: "Legal Advisor",
    body: "Legal Affairs",
  },
  {
    name: "Suman G.",
    email: "suman.g@agency.gov.in",
    position: "Investigator",
    body: "Compliance",
  },
  {
    name: "Preethi M.",
    email: "preethi.m@agency.gov.in",
    position: "Coordinator",
    body: "Citizen Services",
  },
  {
    name: "Dinesh T.",
    email: "dinesh.t@agency.gov.in",
    position: "Reporter",
    body: "Documentation",
  },
];

// Case data for demo
const CASES = [
  {
    slno: 1,
    subject: "Unauthorized Construction - Ward 15",
    sentinel: { name: "Ravi Kumar", email: "ravi.kumar@veda.gov.in" },
    team: [
      { name: "Priya S.", task: "Inspection" },
      { name: "Ajay R.", task: "Legal Review" },
    ],
    status: "Under Review",
    reports: ["Notice.pdf", "InspectionReport.pdf"],
  },
  {
    slno: 2,
    subject: "Noise Complaint - XYZ Street",
    sentinel: { name: "Anjali Nair", email: "anjali.nair@veda.gov.in" },
    team: [
      { name: "Suman G.", task: "Investigation" },
      { name: "Preethi M.", task: "Coordination" },
      { name: "Dinesh T.", task: "Reporting" },
    ],
    status: "Resolved",
    reports: ["FinalReport.pdf"],
  },
];

// Theme switch hook
function useTheme() {
  const [mode, setMode] = useState("dark");
  const theme = mode === "light" ? LIGHT : DARK;
  return { theme, mode, setMode };
}

// Sidebar component
function Sidebar({ expanded, onToggle, nav, active, onNav, theme, mode }: any) {
  return (
    <aside
      style={{
        width: expanded ? 210 : 62,
        background: theme.sidebarBg,
        color: theme.sidebarFg,
        transition: "width .33s",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        borderRight: `1.5px solid ${theme.border}`,
        boxShadow: expanded
          ? theme.shadow
          : "none",
      }}
    >
      <div style={{
        padding: "22px 12px 16px 16px",
        display: "flex",
        alignItems: "center",
        gap: 13,
        borderBottom: `1.5px solid ${theme.border}`
      }}>
        <button
          aria-label="Expand/collapse sidebar"
          style={{
            background: theme.navActive,
            border: "none",
            borderRadius: "100%",
            width: 38,
            height: 38,
            color: theme.sidebarFg,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={onToggle}
        >
          <MenuIcon size={21}/>
        </button>
        <div style={{
          fontWeight: 700,
          fontSize: "1.1rem",
          fontFamily: GEMINI_FONT,
          letterSpacing: ".025em",
          color: theme.sidebarFg,
        }}>
          {expanded ? "Council" : "C"}
        </div>
      </div>
      <nav style={{ flex: 1, marginTop: 16 }}>
        <ul style={{
          listStyle: "none",
          margin: 0,
          padding: expanded ? "0" : 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
          {nav.map((item: any, idx: number) => (
            <li key={item.title}>
              <button
                aria-label={item.title}
                style={{
                  width: "100%",
                  background: active === idx ? theme.navActive : "none",
                  border: "none",
                  color: theme.sidebarFg,
                  fontFamily: GEMINI_FONT,
                  fontWeight: active === idx ? 600 : 500,
                  fontSize: expanded ? ".97rem" : "0px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: expanded ? "flex-start" : "center",
                  gap: expanded ? 13 : 0,
                  padding: expanded ? "11px 21px" : "11px 10px",
                  borderRadius: expanded ? 21 : "100%",
                  cursor: "pointer",
                  minHeight: 42,
                  transition: "background .18s",
                  outline: "none",
                }}
                onClick={() => onNav(idx)}
              >
                <span style={{
                  minWidth: expanded ? 22 : 30,
                  textAlign: "center",
                  color: theme.sidebarFg,
                  fontSize: "1.21rem",
                }}>
                  {item.icon}
                </span>
                {expanded && <span>{item.title}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// Modal/modal panel
function ModalPanel({ open, children, onClose, theme }: any) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1002,
        background: theme.mode === "dark" ? "rgba(21,24,38,0.53)" : "rgba(200,208,227,0.22)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 470,
          background: theme.cardBg,
          color: theme.sidebarFg,
          borderRadius: 22,
          boxShadow: theme.shadow,
          border: `1px solid ${theme.border}`,
          padding: "0 0 0 0",
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          style={{
            position: "absolute",
            top: 18, right: 20,
            background: "none",
            border: "none",
            fontSize: "1.41rem",
            borderRadius: 40,
            color: theme.faded,
            cursor: "pointer",
            padding:2,
            zIndex:1004,
          }}
          onClick={onClose}
        ><X size={22}/></button>
        <div style={{padding:"30px 36px 30px 36px"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Agency members list row
function AgencyListPanel({ open, theme, onClose }: any) {
  return (
    <ModalPanel open={open} theme={theme} onClose={onClose}>
      <div style={{fontWeight:700, fontSize:"1.10rem", color:theme.sidebarFg, letterSpacing:".01em",marginBottom:"13px",fontFamily:GEMINI_FONT}}>
        Agency Team Officers
      </div>
      <table style={{width:"100%", borderCollapse:"collapse", fontSize:".98rem"}}>
        <thead>
          <tr style={{color:theme.faded, fontWeight:600, fontSize:".99rem"}}>
            <th style={{padding:"7px 7px",textAlign:"left"}}>Name</th>
            <th style={{padding:"7px 7px",textAlign:"left"}}>Email</th>
            <th style={{padding:"7px 7px",textAlign:"left"}}>Position</th>
            <th style={{padding:"7px 7px",textAlign:"left"}}>Body</th>
          </tr>
        </thead>
        <tbody>
          {AGENCY_MEMBERS.map((m, idx) => (
            <tr key={idx}
              style={{
                background: (theme.mode==="dark")
                  ? (idx%2===0 ? "#232430" : "#22232B")
                  : (idx%2===0 ? "#f0f4fe" : "#e2e6f9"),
                color: theme.sidebarFg,
              }}>
              <td style={{padding:"10px 7px",fontWeight:500}}>{m.name}</td>
              <td style={{padding:"10px 7px",fontWeight:500}}>{m.email}</td>
              <td style={{padding:"10px 7px"}}>{m.position}</td>
              <td style={{padding:"10px 7px"}}>{m.body}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ModalPanel>
  );
}

// ChatGPT settings replica modal
function SettingsPanel({ open, mode, setMode, theme, onClose }: any) {
  const [activeSection, setActiveSection] = useState("General");
  const [notifOn, setNotifOn] = useState(true);

  // Side tabs mimic screenshot left pane ≈ ChatGPT
  const SECTIONS = [
    { key: "General", icon: <Settings size={18}/> },
    { key: "Notifications", icon: <Bell size={18}/> },
    { key: "Data controls", icon: <Database size={18}/> },
    { key: "Security", icon: <Shield size={18}/> },
    { key: "Account", icon: <User size={18}/> },
  ];

  // Content panels
  function renderContent() {
    if (activeSection === "General")
      return (
        <div style={{fontFamily:CHATGPT_FONT, color:theme.sidebarFg,marginLeft:5}}>
          <div style={{fontWeight:600, fontSize:".99rem", marginBottom:14}}>Theme</div>
          <div>
            <button
              onClick={()=>setMode(mode==="light"?"dark":"light")}
              style={{
                border:"none",
                background:theme.hover,
                color:theme.sidebarFg,
                borderRadius:18,
                padding:"7px 23px",
                fontWeight:600,
                fontFamily:CHATGPT_FONT,
                fontSize:".99rem",
                outline:"none",
                boxShadow:"0 .5px 4px #0001"
              }}>
              {mode==="light"?
                <><Sun size={18} style={{marginRight:7, color:"#FFD600"}}/>Light</>:
                <><Moon size={18} style={{marginRight:7, color:"#5C84F7"}}/>Dark</>}
            </button>
          </div>
        </div>
      );
    if (activeSection==="Notifications")
      return (
        <div style={{fontFamily:CHATGPT_FONT, color:theme.sidebarFg,marginLeft:5}}>
          <div style={{fontWeight:600, fontSize:".99rem", marginBottom:14}}>Notifications</div>
          <label style={{display:"flex",alignItems:"center",gap:12}}>
            <Bell size={19} style={{opacity:.62}}/>
            <span style={{marginRight:10}}>Enable notifications</span>
            <input
              type="checkbox"
              checked={notifOn}
              onChange={() => setNotifOn(!notifOn)}
              style={{accentColor:theme.accent}}
            />
          </label>
        </div>
      );
    if (activeSection==="Data controls")
      return (
        <div style={{fontFamily:CHATGPT_FONT, color:theme.sidebarFg,marginLeft:5}}>
          <div style={{fontWeight:600, fontSize:".99rem", marginBottom:14}}>Data Controls</div>
          <ul style={{listStyle:"none",margin:0,padding:0,color:theme.sidebarFg}}>
            <li style={{marginBottom:9,fontSize:".98rem"}}>Delete all case records</li>
            <li style={{marginBottom:9,fontSize:".98rem"}}>Export data (.csv/.pdf)</li>
            <li style={{marginBottom:9,fontSize:".98rem"}}>Download case summaries</li>
            <li style={{marginBottom:9,fontSize:".98rem"}}>Clear agency activity logs</li>
          </ul>
        </div>
      );
    // For Security/Account, placeholder or expand as needed.
    return <div style={{fontFamily:CHATGPT_FONT, color:theme.sidebarFg,marginLeft:5}}>Coming soon</div>;
  }

  return (
    <ModalPanel open={open} theme={{...theme, mode}}>
      <div style={{display:"flex",flexDirection:"row",height:"320px"}}>
        {/* Side settings navigation */}
        <nav style={{
          width:"140px",
          background: theme.mode==="dark"?"#23262C":"#F4F6FA",
          borderRadius:"14px",
          padding:"19px 8px",
          boxShadow:"0 1px 9px #21252b14",
          display:"flex",flexDirection:"column",gap:3
        }}>
          {SECTIONS.map(s=>(
            <button key={s.key}
              onClick={()=>setActiveSection(s.key)}
              style={{
                width:"100%",
                background: activeSection===s.key?
                  (theme.mode==="dark"? "#26292F":"#ECEFF7"):"none",
                color:theme.sidebarFg,
                fontWeight:activeSection===s.key?600:500,
                fontSize:".98rem",
                border:"none",
                borderRadius:"10px",
                padding:"9px 7px",
                display:"flex",
                alignItems:"center",
                gap:13,
                marginBottom:1,
                fontFamily:CHATGPT_FONT,
                cursor:"pointer",
                outline:"none",
              }}
            >
              <span>{s.icon}</span>
              <span>{s.key}</span>
            </button>
          ))}
        </nav>
        {/* Right panel panel */}
        <div style={{
          flex:1,
          padding:"27px 24px",
          background: theme.cardBg,
          color: theme.sidebarFg,
          borderRadius:"14px",
          marginLeft:"14px",
        }}>
          {renderContent()}
        </div>
      </div>
    </ModalPanel>
  );
}

// Team popup for in-table team view
function TeamPopup({ members, anchorRect, onClose, theme }: any) {
  if (!anchorRect) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: anchorRect.left,
        top: anchorRect.bottom + 5,
        background: theme.popupBg,
        color: theme.sidebarFg,
        fontFamily: GEMINI_FONT,
        borderRadius: 10,
        boxShadow: theme.shadow,
        minWidth: 210,
        zIndex: 999,
        border: `1px solid ${theme.border}`,
        padding: "16px 20px",
      }}
      tabIndex={-1}
      onMouseLeave={onClose}
    >
      <div style={{ fontWeight: 600, fontSize: ".97rem", marginBottom: 7, opacity: .85 }}>
        Agency Team Members
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {members.map((mem: any, idx: number) => (
          <li key={idx} style={{ paddingBottom: 3, fontSize: ".99rem" }}>
            <span style={{ fontWeight: 500 }}>{mem.name}</span>
            <span style={{ fontStyle: "italic", opacity: .68, marginLeft: 6, fontSize: ".93em" }}>
              ({mem.task})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Main council dashboard page
export default function CouncilDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navIdx, setNavIdx] = useState(0);
  const [teamPopupIdx, setTeamPopupIdx] = useState<number | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [agenciesOpen, setAgenciesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, mode, setMode } = useTheme();

  const nav = [
    { title: "All Reports", icon: <List size={22}/> },
    { title: "Agencies", icon: <Users size={22}/> },
    { title: "Settings", icon: <Settings size={22}/> },
    { title: "Help", icon: <HelpCircle size={22}/> },
  ];

  // Handle Team button click
  function handleTeamClick(idx: number, e: any) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTeamPopupIdx(idx);
    setAnchorRect(rect);
  }
  function handleTeamClose() {
    setTeamPopupIdx(null);
    setAnchorRect(null);
  }

  // Navigation selection logic
  function handleNav(idx: number) {
    setNavIdx(idx);
    setAgenciesOpen(false);
    setSettingsOpen(false);
    if(idx===1) setAgenciesOpen(true);
    else if(idx===2) setSettingsOpen(true);
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: theme.mainBg,
        fontFamily: GEMINI_FONT,
        color: theme.sidebarFg,
      }}
    >
      {/* Sidebar */}
      <Sidebar
        expanded={sidebarOpen}
        onToggle={()=>setSidebarOpen((open:boolean)=>!open)}
        nav={nav}
        active={navIdx}
        onNav={handleNav}
        theme={{...theme, mode}}
        mode={mode}
      />

      {/* Main dashboard */}
      <main
        style={{
          flex: 1,
          padding: "38px 0",
          background: theme.mainBg,
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          {/* Main Heading */}
          <h1
            style={{
              fontFamily: GEMINI_FONT,
              fontSize: "2rem",
              fontWeight: 700,
              margin: "6px 0 27px 2px",
              background: `linear-gradient(90deg, ${theme.accentSidebar} 0%, ${theme.accentHighlight} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: ".005em",
            }}
          >
            Cases
          </h1>

          {/* Cases Table/List */}
          <div
            style={{
              borderRadius: 17,
              overflow: "hidden",
              background: theme.cardBg,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: GEMINI_FONT,
                background: "none",
                fontSize: "1rem",
                minWidth: 750,
                color: theme.sidebarFg,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: theme.sidebarBg,
                    color: theme.faded,
                    fontWeight: 600,
                    fontSize: "1.04rem",
                  }}
                >
                  <th style={{ padding: "13px 12px" }}>Sl. No.</th>
                  <th style={{ padding: "13px 12px", textAlign: "left" }}>Case/Subject</th>
                  <th style={{ padding: "13px 12px", textAlign: "left" }}>Sentinel (Assigned)</th>
                  <th style={{ padding: "13px 12px" }}>Team</th>
                  <th style={{ padding: "13px 12px" }}>Status</th>
                  <th style={{ padding: "13px 12px" }}>Reports</th>
                </tr>
              </thead>
              <tbody>
                {CASES.map((c, idx) => (
                  <tr
                    key={c.slno}
                    style={{
                      background: mode==="light"
                        ? (idx%2===0 ? "#f7faff" : "#ebf1fe")
                        : (idx%2===0 ? "#232430" : "#22232B"),
                      borderTop: `1px solid ${theme.border}`,
                    }}
                  >
                    <td style={{ padding: "14px 12px", textAlign: "center", fontWeight: 500 }}>
                      {c.slno}
                    </td>
                    <td style={{ padding: "14px 12px", fontWeight: 500, minWidth: 155 }}>
                      {c.subject}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{c.sentinel.name}</span>
                        <span
                          style={{
                            fontWeight: 400,
                            fontSize: ".95em",
                            marginLeft: 7,
                            opacity: .49,
                          }}
                        >
                          {c.sentinel.email}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                      <button
                        onClick={e => handleTeamClick(idx, e)}
                        style={{
                          background: theme.navActive,
                          border: 0,
                          borderRadius: 10,
                          color: theme.sidebarFg,
                          fontWeight: 500,
                          fontFamily: GEMINI_FONT,
                          padding: "6px 13px 6px 14px",
                          cursor: "pointer",
                          minWidth: 63,
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                        tabIndex={0}
                        id={`team-btn-${idx}`}
                      >
                        Team
                        <ChevronDown size={18} style={{ opacity: .63 }} />
                      </button>
                      {teamPopupIdx === idx && (
                        <TeamPopup
                          members={c.team}
                          anchorRect={anchorRect}
                          onClose={handleTeamClose}
                          theme={{...theme, mode}}
                        />
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "3px 13px",
                          borderRadius: 21,
                          fontWeight: 600,
                          background:
                            c.status === "Resolved"
                              ? "linear-gradient(87deg,#93e26a 0%,#a7e89c 73%)"
                              : "linear-gradient(90deg,#49a7f7 0%, #638efc 100%)",
                          color: c.status === "Resolved" ? "#2c3e11" : "#182d47",
                          fontSize: ".96em",
                          letterSpacing: ".011em",
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "center" }}>
                      <button
                        style={{
                          background: `linear-gradient(90deg, ${theme.accentSidebar} 0%, ${theme.accentHighlight} 100%)`,
                          border: 0,
                          color: "#fff",
                          borderRadius: 7,
                          fontWeight: 500,
                          padding: "6px 18px",
                          cursor: "pointer",
                          fontFamily: GEMINI_FONT,
                          fontSize: ".95em",
                          boxShadow: "0 2.5px 13px #1b233a22",
                        }}
                        tabIndex={0}
                        onClick={() =>
                          window.alert(
                            `Reports for ${c.subject}:\n` + c.reports.join("\n")
                          )
                        }
                      >
                        <FileText size={18} style={{marginRight:6,opacity:.8}}/>
                        Reports
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Modal panels */}
        <AgencyListPanel open={agenciesOpen} theme={{...theme, mode}} onClose={()=>setAgenciesOpen(false)}/>
        <SettingsPanel open={settingsOpen} mode={mode} setMode={setMode} theme={{...theme, mode}} onClose={()=>setSettingsOpen(false)}/>
      </main>
    </div>
  );
}
