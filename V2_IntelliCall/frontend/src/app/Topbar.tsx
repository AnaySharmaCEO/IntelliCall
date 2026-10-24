import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { useToast } from '../components/ui';
import { Search, Bell, LogOut, Shield, CheckCircle2, Sun, Moon } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, organization, role, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('ic-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ic-theme', next);
    setTheme(next);
    window.dispatchEvent(new Event('theme-change'));
  };

  useEffect(() => {
    const onThemeChange = () => {
      const stored = localStorage.getItem('ic-theme');
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      }
    };
    window.addEventListener('theme-change', onThemeChange);
    window.addEventListener('storage', onThemeChange);
    return () => {
      window.removeEventListener('theme-change', onThemeChange);
      window.removeEventListener('storage', onThemeChange);
    };
  }, []);

  useEffect(() => {
    if (!dropdownOpen && !notificationsOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen, notificationsOpen]);

  return (
    <header className="h-16 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-subtle)] px-6 flex items-center justify-between shrink-0 z-10 transition-colors">
      {/* Search Bar / Cmd+K Trigger */}
      <div className="flex items-center gap-3 w-48 sm:w-64 md:w-72">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              ctrlKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className="flex items-center justify-between w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-sunken)]/60 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-border-focus)] transition-colors cursor-pointer shadow-2xs gap-2 min-w-0"
        >
          <span className="flex items-center gap-2 truncate min-w-0">
            <Search size={14} className="text-[var(--color-text-muted)] shrink-0" />
            <span className="truncate">Search or jump to...</span>
          </span>
          <kbd className="font-mono text-[10px] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] px-1.5 py-0.5 rounded shadow-2xs font-semibold shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Tools & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Org & Role Badge */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="font-semibold text-[var(--color-text-secondary)]">
            {organization?.name || 'IntelliCall Cloud'}
          </span>
          {role && (
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold font-mono bg-[var(--color-action-secondary-bg)] text-[var(--color-action-secondary-text)] border border-[var(--color-action-secondary-border)]">
              {role}
            </span>
          )}
        </div>

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)] rounded-lg transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              if (dropdownOpen) setDropdownOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setNotificationsOpen((prev) => !prev);
                if (dropdownOpen) setDropdownOpen(false);
              }
            }}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)] rounded-lg transition-colors cursor-pointer relative"
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <Bell size={16} />
          </button>

          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Notifications panel"
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] shadow-xl py-0 z-50 animate-slide-up overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                    Notifications
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]">
                    0 unread
                  </span>
                </div>
              </div>

              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-center mx-auto text-[var(--color-success)]">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                  You're all caught up
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-xs mx-auto">
                  No new alerts, compliance notices, or system notifications at this time.
                </p>
              </div>

              <div className="px-4 py-2.5 bg-[var(--color-bg-sunken)]/60 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono">
                <span>Telemetry: Active</span>
                <span>System Normal</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[var(--color-action-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-action-primary)] transition-all cursor-pointer"
            aria-label="User profile menu"
            aria-expanded={dropdownOpen}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-xs select-none ring-1 ring-white/10">
              {user?.avatarInitials || (user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U')}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] shadow-xl py-2 z-50 animate-slide-up">
              <div className="px-4 py-2.5 border-b border-[var(--color-border-subtle)]">
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                  {user?.name || 'Authorized Member'}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] font-mono truncate">
                  {user?.email || 'member@intellicall.ai'}
                </p>
              </div>

              <div className="py-1">
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                  <Shield size={14} className="text-[var(--color-text-muted)] shrink-0" />
                  <span>Role: <strong className="capitalize text-[var(--color-text-primary)]">{role || 'Member'}</strong></span>
                </div>
              </div>

              <div className="border-t border-[var(--color-border-subtle)] pt-1 mt-1">
                <button
                  onClick={async () => {
                    setDropdownOpen(false);
                    await signOut();
                    localStorage.removeItem('intellicall_auth_token');
                    localStorage.removeItem('sb-wdmensuuqsbnxzecqlwz-auth-token');
                    queryClient.clear();
                    navigate('/', { replace: true });
                    toast('Signed out successfully', 'info');
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors cursor-pointer"
                >
                  <LogOut size={14} className="shrink-0" />
                  <span>Sign out of Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
