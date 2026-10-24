import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui';
import {
  LayoutDashboard,
  PhoneCall,
  Bot,
  Megaphone,
  Users,
  ShieldCheck,
  BarChart3,
  Palette,
  Radio,
  CheckSquare,
  Calendar,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth';
import { cn } from '../lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
  { to: '/calls', label: 'Calls', icon: <PhoneCall size={17} /> },
  { to: '/calls/live', label: 'Live Monitor', icon: <Radio size={17} />, badge: 'LIVE' },
  { to: '/review', label: 'Review Queue', icon: <CheckSquare size={17} /> },
  { to: '/agents', label: 'AI Agents', icon: <Bot size={17} /> },
  { to: '/campaigns', label: 'Campaigns', icon: <Megaphone size={17} /> },
  { to: '/leads', label: 'Leads', icon: <Users size={17} /> },
  { to: '/appointments', label: 'Appointments', icon: <Calendar size={17} /> },
  { to: '/compliance', label: 'Compliance', icon: <ShieldCheck size={17} /> },
  { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={17} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={17} /> },
  { to: '/__kit', label: 'Component Kit', icon: <Palette size={17} /> },
];

export const Sidebar: React.FC = () => {
  const { organization, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);

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
    document.documentElement.setAttribute('data-theme', theme);
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
  }, [theme]);

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-[var(--color-bg-surface)] border-r border-[var(--color-border-subtle)] transition-[width] duration-200 ease-in-out select-none shrink-0 z-20 relative',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Rail Toggle Button on Border */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-5 w-6 h-6 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-action-primary)] hover:scale-105 z-30 transition-all cursor-pointer',
          collapsed ? 'flex' : 'hidden md:flex'
        )}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Brand Header */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-[var(--color-border-subtle)] shrink-0',
          collapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        <Link
          to="/dashboard"
          className={cn(
            'flex items-center gap-3 group',
            collapsed ? 'justify-center' : 'min-w-0'
          )}
          title="IntelliCall Dashboard"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ring-1 ring-white/10 group-hover:scale-105 transition-transform">
            IC
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[14px] tracking-tight text-[var(--color-text-primary)] truncate">
                IntelliCall
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)] truncate font-medium">
                {organization?.name || 'Enterprise'}
              </span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-[var(--color-action-secondary-bg)] text-[var(--color-action-primary)] font-semibold shadow-2xs'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)]',
                collapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : ''
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Tools */}
      <div className="p-3 border-t border-[var(--color-border-subtle)] space-y-1.5 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-1.5 rounded-lg text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer',
            collapsed ? 'justify-center px-0' : ''
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} className="shrink-0" /> : <ChevronLeft size={15} className="shrink-0" />}
          {!collapsed && <span>Collapse sidebar</span>}
        </button>

        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)] transition-colors',
            collapsed ? 'justify-center px-0' : ''
          )}
          title="View Public Landing Page"
        >
          <ExternalLink size={15} className="shrink-0" />
          {!collapsed && <span>Public Landing</span>}
        </Link>

        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-1.5 rounded-lg text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer',
            collapsed ? 'justify-center px-0' : ''
          )}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? <Moon size={15} className="shrink-0" /> : <Sun size={15} className="shrink-0 text-amber-400" />}
          {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        <button
          onClick={async () => {
            await signOut();
            localStorage.removeItem('intellicall_auth_token');
            localStorage.removeItem('sb-wdmensuuqsbnxzecqlwz-auth-token');
            queryClient.clear();
            navigate('/', { replace: true });
            toast('Signed out successfully', 'info');
          }}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-1.5 rounded-lg text-[12px] text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors cursor-pointer',
            collapsed ? 'justify-center px-0' : ''
          )}
          title="Sign out of account"
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
