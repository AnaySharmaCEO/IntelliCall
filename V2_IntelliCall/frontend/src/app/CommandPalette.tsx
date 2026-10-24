import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  PhoneCall,
  Bot,
  Megaphone,
  Users,
  ShieldCheck,
  BarChart3,
  Palette,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (action: () => void) => {
    setOpen(false);
    action();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/50 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden animate-slide-up">
        <Command className="w-full">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-subtle)]">
            <Search size={16} className="text-[var(--color-text-muted)] shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command or search..."
              className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
            />
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]">
              ESC
            </span>
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2 text-xs">
            <Command.Empty className="py-6 text-center text-xs text-[var(--color-text-muted)]">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-1">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/calls'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <PhoneCall size={15} />
                <span>Calls & Auditing</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/calls/live'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <PhoneCall size={15} />
                <span>Live Call Monitor</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/review'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <ShieldCheck size={15} />
                <span>Decision Review Queue</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/agents'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <Bot size={15} />
                <span>AI Agents</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/campaigns'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <Megaphone size={15} />
                <span>Campaigns</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/leads'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <Users size={15} />
                <span>Leads</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/compliance'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <ShieldCheck size={15} />
                <span>Compliance Engine</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/analytics'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <BarChart3 size={15} />
                <span>Analytics & Funnel</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Developer & Tools" className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-1 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/__kit'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-bg-sunken)] aria-selected:bg-[var(--color-action-secondary-bg)] aria-selected:text-[var(--color-action-primary)]"
              >
                <Palette size={15} />
                <span>UI Component Kit & Primitives (/__kit)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => signOut())}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] text-[var(--color-error)] cursor-pointer hover:bg-[var(--color-error-bg)]"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;
