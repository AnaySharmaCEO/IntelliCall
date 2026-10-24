import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Theme toggle logic mirrors the sidebar — same localStorage key, same data-theme attribute.
function getTheme(): "light" | "dark" {
  const stored = localStorage.getItem("ic-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setTheme(t: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("ic-theme", t);
}

export default function Topbar() {
  const { user, profile, organization, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">(() => getTheme());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/leads?q=${encodeURIComponent(search)}`);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    setThemeState(next);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setProfileOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [profileOpen]);

  return (
    <header
      className="h-14 flex-shrink-0 flex items-center justify-between px-6"
      style={{
        background: "var(--color-bg-surface)",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <form onSubmit={handleSearch}>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "var(--color-text-muted)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads, calls, decisions…"
            className="w-72 h-8 pl-8 pr-3 rounded-[var(--radius-sm)] text-[13px] focus:outline-none transition-colors"
            style={{
              border: "1px solid var(--color-border-default)",
              background: "var(--color-bg-primary)",
              color: "var(--color-text-secondary)",
            }}
          />
        </div>
      </form>

      <div className="flex items-center gap-4 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
        <span className="font-medium">{organization?.name || "My Workspace"}</span>

        {/* Profile avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors"
            style={{
              background: profileOpen ? "var(--color-action-primary-solid)" : "var(--color-action-secondary-bg)",
              color: profileOpen ? "#fff" : "var(--color-action-primary)",
            }}
            title={profile?.name || user?.email || "User profile"}
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            {profile?.avatar_initials || user?.email?.slice(0, 2).toUpperCase() || "US"}
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-9 w-52 rounded-[var(--radius-md)] overflow-hidden z-50"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
                boxShadow: "var(--shadow-md)",
              }}
              role="menu"
            >
              {/* User info */}
              <div
                className="px-3 py-3"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {profile?.name || user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-[11px]" style={{ fontFamily: "var(--font-data)", color: "var(--color-text-muted)" }}>
                  {profile?.email || user?.email || ""}
                </p>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
                role="menuitem"
              >
                <span>{theme === "dark" ? "Switch to light" : "Switch to dark"}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {theme === "dark" ? (
                    <circle cx="12" cy="12" r="5" />
                  ) : (
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  )}
                </svg>
              </button>

              {/* Account settings */}
              <Link
                to="/settings/account"
                onClick={() => setProfileOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 text-[13px] transition-colors"
                style={{ color: "var(--color-text-secondary)", display: "flex" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
                role="menuitem"
              >
                <span>Account settings</span>
              </Link>

              {/* Log out */}
              <div style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <button
                  onClick={async () => {
                    setProfileOpen(false);
                    await signOut();
                    navigate("/signin");
                  }}
                  className="w-full flex items-center px-3 py-2.5 text-[13px] transition-colors"
                  style={{ color: "var(--color-error)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                  role="menuitem"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
