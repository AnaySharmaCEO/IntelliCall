import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

// ── Icon definitions ──────────────────────────────────────────────────────────

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  leads: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  ),
  campaigns: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" />
    </svg>
  ),
  agents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  calls: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .5 3 .7a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
  decisions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  outcomes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  ),
  strategies: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: icons.dashboard },
  { path: "/leads",     label: "Leads",     icon: icons.leads },
  { path: "/campaigns", label: "Campaigns", icon: icons.campaigns },
  { path: "/agents",    label: "Agents",    icon: icons.agents },
  { path: "/calls",     label: "Calls",     icon: icons.calls },
  { path: "/decisions", label: "Decisions", icon: icons.decisions },
  { path: "/outcomes",  label: "Outcomes",  icon: icons.outcomes },
];

const MUTED_ITEMS = [
  { path: "/strategies", label: "Strategies", icon: icons.strategies, tag: "Later" },
];

const BOTTOM_ITEMS = [
  { path: "/settings", label: "Settings", icon: icons.settings },
];

// ── Theme persistence ─────────────────────────────────────────────────────────

function getStoredTheme(): "light" | "dark" {
  const stored = localStorage.getItem("ic-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const COLLAPSED_W = 56;   // px — icon rail width
const EXPANDED_W  = 240;  // px — full sidebar width

export default function Sidebar() {
  const [theme, setTheme] = useState<"light" | "dark">(getStoredTheme);
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ic-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 80);
  };

  return (
    <>
      {/* ── Fixed-width rail placeholder — keeps page layout stable ── */}
      <div
        style={{ width: COLLAPSED_W, flexShrink: 0 }}
        aria-hidden="true"
      />

      {/* ── The actual sidebar — fixed, overlays on expand ── */}
      <div
        className="fixed top-0 left-0 h-full z-40 flex flex-col"
        style={{
          width: hovered ? EXPANDED_W : COLLAPSED_W,
          background: "var(--color-bg-surface)",
          borderRight: "1px solid var(--color-border-subtle)",
          boxShadow: hovered ? "var(--shadow-lg)" : "none",
          transition: `width var(--duration-base) var(--easing-standard), box-shadow var(--duration-base) var(--easing-standard)`,
          overflow: "hidden",
          willChange: "width",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div
          className="flex items-center h-14 flex-shrink-0 border-b"
          style={{
            borderColor: "var(--color-border-subtle)",
            paddingLeft: 16,
            gap: 10,
          }}
        >
          {/* Mark */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded text-[12px] font-semibold"
            style={{
              width: 24,
              height: 24,
              borderRadius: "var(--radius-sm)",
              background: "var(--color-action-primary-solid)",
              color: "var(--color-text-on-accent)",
            }}
          >
            IC
          </div>
          {/* Wordmark — visible when expanded */}
          <span
            className="font-semibold text-[15px] whitespace-nowrap"
            style={{
              color: "var(--color-text-primary)",
              opacity: hovered ? 1 : 0,
              transition: `opacity ${hovered ? "100ms" : "60ms"} var(--easing-standard)`,
              transitionDelay: hovered ? "80ms" : "0ms",
            }}
          >
            IntelliCall
          </span>
        </div>

        {/* Nav list */}
        <nav className="flex flex-col flex-1 overflow-hidden py-2" role="navigation">
          {/* Primary items */}
          <div className="flex flex-col gap-0.5 px-2">
            {NAV_ITEMS.map(item => (
              <NavItem key={item.path} {...item} expanded={hovered} />
            ))}
          </div>

          {/* Muted / future */}
          <div className="flex flex-col gap-0.5 px-2 mt-0.5">
            {MUTED_ITEMS.map(item => (
              <NavItem key={item.path} {...item} expanded={hovered} muted tag={item.tag} />
            ))}
          </div>

          {/* Divider */}
          <div
            className="mx-2 my-2"
            style={{ height: 1, background: "var(--color-border-subtle)" }}
          />

          {/* Bottom items */}
          <div className="flex flex-col gap-0.5 px-2">
            {BOTTOM_ITEMS.map(item => (
              <NavItem key={item.path} {...item} expanded={hovered} />
            ))}
          </div>
        </nav>

        {/* Footer: theme toggle + avatar */}
        <div
          className="flex items-center flex-shrink-0 border-t"
          style={{
            borderColor: "var(--color-border-subtle)",
            height: 56,
            padding: "0 12px",
            gap: 8,
          }}
        >
          {/* Theme toggle — always an icon, label appears when expanded */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 flex-shrink-0 rounded-[var(--radius-pill)] transition-colors hover:opacity-80"
            style={{
              height: 30,
              padding: "0 8px",
              background: "var(--color-bg-sunken)",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: 12,
              fontWeight: 500,
            }}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="w-3.5 h-3.5 flex-shrink-0">
              {theme === "dark" ? icons.sun : icons.moon}
            </span>
            <span
              className="whitespace-nowrap text-[12px]"
              style={{
                opacity: hovered ? 1 : 0,
                transition: `opacity ${hovered ? "100ms" : "60ms"} var(--easing-standard)`,
                transitionDelay: hovered ? "80ms" : "0ms",
                maxWidth: hovered ? 80 : 0,
                overflow: "hidden",
              }}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
          </button>

          {/* Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full text-[11px] font-semibold ml-auto"
            style={{
              width: 28,
              height: 28,
              background: "var(--color-action-secondary-bg)",
              color: "var(--color-action-primary)",
              cursor: "default",
            }}
            title="Jamie Rivera"
          >
            JR
          </div>
        </div>
      </div>
    </>
  );
}

// ── NavItem ───────────────────────────────────────────────────────────────────

interface NavItemProps {
  path: string;
  label: string;
  icon: React.ReactNode;
  expanded: boolean;
  muted?: boolean;
  tag?: string;
}

function NavItem({ path, label, icon, expanded, muted, tag }: NavItemProps) {
  return (
    <NavLink
      to={path}
      title={!expanded ? label : undefined}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 36,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: "var(--radius-sm)",
        borderLeft: `2px solid ${isActive ? "var(--color-action-primary)" : "transparent"}`,
        background: isActive ? "var(--color-action-secondary-bg)" : "transparent",
        color: isActive
          ? "var(--color-action-primary)"
          : muted
          ? "var(--color-text-muted)"
          : "var(--color-text-secondary)",
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        textDecoration: "none",
        opacity: muted ? 0.6 : 1,
        transition: `background var(--duration-fast), color var(--duration-fast)`,
        overflow: "hidden",
        whiteSpace: "nowrap",
        flexShrink: 0,
      })}
      className={({ isActive }) =>
        !isActive ? "hover:!bg-[var(--color-bg-sunken)] hover:!text-[var(--color-text-primary)]" : ""
      }
    >
      {/* Icon — always visible at 16×16 */}
      <span
        className="flex-shrink-0"
        style={{ width: 16, height: 16, display: "flex" }}
      >
        {icon}
      </span>

      {/* Label + optional tag — fades in when expanded */}
      <span
        className="flex items-center gap-1.5"
        style={{
          opacity: expanded ? 1 : 0,
          transition: `opacity ${expanded ? "100ms" : "60ms"} var(--easing-standard)`,
          transitionDelay: expanded ? "80ms" : "0ms",
        }}
      >
        {label}
        {tag && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.02em",
              background: "var(--color-bg-sunken)",
              color: "var(--color-text-muted)",
              padding: "1px 6px",
              borderRadius: "var(--radius-pill)",
              marginLeft: "auto",
            }}
          >
            {tag}
          </span>
        )}
      </span>
    </NavLink>
  );
}
