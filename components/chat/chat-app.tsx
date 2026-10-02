'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Menu, Moon, PanelLeftClose, PlaySquare, Plus, Sun, Trash2 } from 'lucide-react';
import { ChatThread } from './chat-thread';
import { LectureFinder } from './lecture-finder';
import { loadSessions, newSession, saveSessions } from '@/lib/chat-store';
import type { ChatSession, Mode } from '@/lib/types';

const MODES: { id: Mode; label: string; icon: typeof BookOpen }[] = [
  { id: 'theory', label: 'Theory', icon: BookOpen },
  { id: 'pdf', label: 'PDF Chat', icon: FileText },
  { id: 'lectures', label: 'Lectures', icon: PlaySquare },
];

export function ChatApp() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const stored = loadSessions();
    return stored.length ? stored : [newSession()];
  });
  const [activeId, setActiveId] = useState(() => sessions[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const stopRef = useRef<() => void>(() => {});

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  useEffect(() => {
    saveSessions(sessions.filter((s) => s.messages.length > 0 || s.docs.length > 0));
  }, [sessions]);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<ChatSession>) =>
      setSessions((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    [],
  );

  const create = useCallback((mode: Mode = 'theory') => {
    const s = newSession(mode);
    setSessions((list) => [s, ...list]);
    setActiveId(s.id);
  }, []);

  function remove(id: string) {
    setSessions((list) => {
      const next = list.filter((s) => s.id !== id);
      if (next.length === 0) next.push(newSession());
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  function setMode(mode: Mode) {
    if (mode === active.mode) return;
    if (active.messages.length === 0 && active.docs.length === 0) update(active.id, { mode, title: 'New chat' });
    else create(mode);
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('eh-theme', next ? 'dark' : 'light');
  }

  const registerStop = useCallback((stop: () => void) => {
    stopRef.current = stop;
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        create(active.mode);
      } else if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      } else if (e.key === 'Escape') {
        stopRef.current();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [create, active.mode]);

  const history = sessions.filter((s) => s.messages.length > 0 || s.id === activeId);

  return (
    <div className="flex h-svh overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        aria-label="Chat history"
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col gap-4 border-r border-border bg-background p-3 transition-transform md:static md:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        <div className="flex items-center justify-between px-1 pt-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full border border-primary-2/60">
              <span className="size-2 rounded-full bg-background ring-2 ring-primary/80" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.25em]">EVENT HORIZON</span>
          </Link>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Hide sidebar" className="rounded-lg p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground">
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => create(active.mode)}
          className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:border-accent/50"
        >
          <span className="flex items-center gap-2">
            <Plus className="size-4" aria-hidden="true" /> New chat
          </span>
          <kbd className="font-mono text-[10px] text-muted">Ctrl K</kbd>
        </button>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" aria-label="Previous chats">
          <p className="hud px-2 py-1 text-muted">History</p>
          {history.map((s) => {
            const Icon = MODES.find((m) => m.id === s.mode)?.icon ?? BookOpen;
            return (
              <div
                key={s.id}
                className={`group flex items-center gap-1 rounded-lg pr-1 ${s.id === activeId ? 'bg-foreground/[0.07]' : 'hover:bg-foreground/[0.04]'}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(s.id);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  aria-current={s.id === activeId ? 'page' : undefined}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm"
                >
                  <Icon className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                  <span className="truncate">{s.title}</span>
                </button>
                {s.messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    aria-label={`Delete ${s.title}`}
                    className="rounded p-1 text-muted opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-border pt-3 text-xs text-muted">
          <button type="button" onClick={toggleTheme} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-foreground/5 hover:text-foreground">
            {dark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <p className="px-2 pt-1 leading-relaxed">
            <kbd className="font-mono">Ctrl B</kbd> sidebar · <kbd className="font-mono">Esc</kbd> stop
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-4 px-4 pb-4 pt-3 sm:px-6">
        <header className="flex items-center gap-3">
          {!sidebarOpen && (
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Show sidebar" className="rounded-lg p-2 text-muted hover:bg-foreground/5 hover:text-foreground">
              <Menu className="size-4" />
            </button>
          )}
          <div role="tablist" aria-label="Mode" className="glass flex rounded-full p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active.mode === m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors sm:px-4 ${
                  active.mode === m.id ? 'bg-gradient-to-br from-primary-2 to-primary font-medium text-background' : 'text-muted hover:text-foreground'
                }`}
              >
                <m.icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
          {active.mode === 'lectures' ? (
            <LectureFinder />
          ) : (
            <ChatThread
              key={active.id}
              session={active}
              onChange={(patch) => update(active.id, patch)}
              registerStop={registerStop}
            />
          )}
        </div>
      </main>
    </div>
  );
}
