'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it Works' },
  { href: '#about', label: 'About' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/45 backdrop-blur-xl">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-[#ece8e1]">
          <span className="relative flex size-6 items-center justify-center rounded-full border border-[#ffb347]/60">
            <span className="size-2.5 rounded-full bg-black ring-2 ring-[#ff7a18]/80" />
          </span>
          <span className="font-mono text-xs tracking-[0.28em]">EVENT HORIZON AI</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3 py-1.5 text-sm text-[#ece8e1]/70 transition-colors hover:text-[#ece8e1] focus-visible:outline-2 focus-visible:outline-[#5ee7ff]"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/simulator"
              className="rounded-full px-3 py-1.5 text-sm text-[#ece8e1]/70 transition-colors hover:text-[#ece8e1] focus-visible:outline-2 focus-visible:outline-[#5ee7ff]"
            >
              Simulator
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="rounded-full border border-[#5ee7ff]/50 bg-[#5ee7ff]/10 px-4 py-1.5 text-sm font-medium text-[#5ee7ff] transition-all hover:bg-[#5ee7ff]/20 hover:shadow-[0_0_24px_-6px_#5ee7ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5ee7ff]"
          >
            Launch Chat
          </Link>
          <button
            type="button"
            className="rounded-full p-2 text-[#ece8e1] md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul id="mobile-menu" className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
          {[...LINKS, { href: '/simulator', label: 'Simulator' }].map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-[#ece8e1]/80 hover:bg-white/5"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
