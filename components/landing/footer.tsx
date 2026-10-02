import Link from 'next/link';
import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <p className="font-mono text-xs tracking-[0.28em]">EVENT HORIZON AI</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-5 text-sm text-muted">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <Link href="/simulator" className="hover:text-foreground">Simulator</Link>
          <Link href="/chat" className="hover:text-foreground">Chat</Link>
          <a
            href="https://github.com/darshangopani/nexus"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="hover:text-foreground"
          >
            <Github className="size-5" />
          </a>
        </nav>
        <p className="text-xs text-muted">{`© ${new Date().getFullYear()} Event Horizon AI`}</p>
      </div>
    </footer>
  );
}
