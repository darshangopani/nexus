'use client';

import type { ChatSession, Lecture, Mode } from './types';

const SESSIONS_KEY = 'eh-sessions';
const PLAYLIST_KEY = 'eh-playlist';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: history simply won't persist.
  }
}

export function loadSessions() {
  return read<ChatSession[]>(SESSIONS_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveSessions(sessions: ChatSession[]) {
  write(SESSIONS_KEY, sessions.slice(0, 50));
}

export function newSession(mode: Mode = 'theory'): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    mode,
    updatedAt: Date.now(),
    messages: [],
    docs: [],
    difficulty: 'intermediate',
    eli12: false,
  };
}

export function loadPlaylist() {
  return read<Lecture[]>(PLAYLIST_KEY, []);
}

export function savePlaylist(list: Lecture[]) {
  write(PLAYLIST_KEY, list);
}
