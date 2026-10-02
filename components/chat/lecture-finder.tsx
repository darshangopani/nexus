'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Bookmark, BookmarkCheck, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { loadPlaylist, savePlaylist } from '@/lib/chat-store';
import type { Lecture } from '@/lib/types';

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

const views = new Intl.NumberFormat('en', { notation: 'compact' });

type Query = { topic: string; language: string; duration: string; level: string };

async function fetchLectures([, q]: [string, Query]) {
  const res = await fetch('/api/lectures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(q),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Search failed.');
  return data.lectures as Lecture[];
}

const selectClass =
  'glass rounded-xl px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent [&>option]:bg-background';

export function LectureFinder() {
  const [form, setForm] = useState<Query>({ topic: '', language: 'en', duration: 'any', level: 'beginner' });
  const [query, setQuery] = useState<Query | null>(null);
  const { data: playlist = [], mutate: setPlaylist } = useSWR('eh-playlist', loadPlaylist);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const { data, error, isLoading } = useSWR(query ? ['lectures', query] : null, fetchLectures, {
    revalidateOnFocus: false,
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleSave(l: Lecture) {
    const next = playlist.some((p) => p.id === l.id) ? playlist.filter((p) => p.id !== l.id) : [...playlist, l];
    savePlaylist(next);
    setPlaylist(next, { revalidate: false });
  }

  const list = showPlaylist ? playlist : data;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.topic.trim().length < 2) return;
          setShowPlaylist(false);
          setQuery({ ...form, topic: form.topic.trim() });
        }}
        className="flex flex-col gap-2"
      >
        <div className="glass gradient-border flex items-center gap-2 rounded-2xl p-2">
          <Search className="ml-2 size-4 text-muted" aria-hidden="true" />
          <label htmlFor="topic" className="sr-only">Topic</label>
          <input
            id="topic"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Linear algebra eigenvectors"
            maxLength={200}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={form.topic.trim().length < 2 || isLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-2 to-primary px-4 py-2 text-sm font-semibold text-background disabled:opacity-40"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Find lectures
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={selectClass}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select aria-label="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={selectClass}>
            <option value="any">Any length</option>
            <option value="short">{'Under 4 min'}</option>
            <option value="medium">4 to 20 min</option>
            <option value="long">{'Over 20 min'}</option>
          </select>
          <select aria-label="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={selectClass}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
          <button
            type="button"
            onClick={() => setShowPlaylist((v) => !v)}
            aria-pressed={showPlaylist}
            className={`ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors ${
              showPlaylist ? 'bg-accent/15 text-accent' : 'text-muted hover:text-foreground'
            }`}
          >
            <BookmarkCheck className="size-4" aria-hidden="true" />
            Playlist ({playlist.length})
          </button>
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading && !showPlaylist ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading lectures">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="glass aspect-[4/3] animate-pulse rounded-2xl" />
            ))}
          </ul>
        ) : list && list.length > 0 ? (
          <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((l, i) => {
              const saved = playlist.some((p) => p.id === l.id);
              return (
                <li key={l.id} className="glass glow-hover flex flex-col overflow-hidden rounded-2xl">
                  <a href={l.url} target="_blank" rel="noreferrer" className="relative block aspect-video bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.thumbnail} alt="" loading="lazy" className="size-full object-cover" />
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[11px] text-[#ece8e1]">
                      {formatDuration(l.durationSec)}
                    </span>
                    {!showPlaylist && (
                      <span className="absolute left-2 top-2 rounded-full bg-black/80 px-2 py-0.5 font-mono text-[11px] text-[#ffb347]">
                        Step {l.order ?? i + 1}
                      </span>
                    )}
                  </a>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <a href={l.url} target="_blank" rel="noreferrer" className="line-clamp-2 font-medium leading-snug hover:text-accent">
                      {l.title}
                    </a>
                    <p className="text-xs text-muted">
                      {l.channel} · {views.format(l.views)} views
                    </p>
                    {l.note && <p className="text-pretty text-sm leading-relaxed text-foreground/75">{l.note}</p>}
                    <button
                      type="button"
                      onClick={() => toggleSave(l)}
                      aria-pressed={saved}
                      className="mt-auto flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted hover:bg-foreground/5 hover:text-foreground"
                    >
                      {saved ? <BookmarkCheck className="size-3.5 text-accent" /> : <Bookmark className="size-3.5" />}
                      {saved ? 'Saved' : 'Save to playlist'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="hud text-accent">Lecture Finder</p>
            <p className="text-gold text-balance font-display text-2xl font-semibold sm:text-3xl">
              {showPlaylist ? 'Your playlist is empty.' : error ? 'No signal. Try another search.' : data ? 'No lectures found.' : 'Find the best lectures for any topic.'}
            </p>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Results come from the YouTube Data API, ranked into a learning path by AI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
