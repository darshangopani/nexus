import { Code2, Download, History, Keyboard, Mic, MoonStar, Sigma, Zap } from 'lucide-react';
import { Reveal } from './reveal';

const FEATURES = [
  { icon: Zap, title: 'Streaming responses', body: 'Answers appear as they are written, no waiting.' },
  { icon: Sigma, title: 'Math rendering', body: 'Markdown and LaTeX formulas display cleanly.' },
  { icon: Code2, title: 'Code highlighting', body: 'Syntax-highlighted snippets for any language.' },
  { icon: History, title: 'Chat history', body: 'Pick up any past conversation where you left off.' },
  { icon: Download, title: 'Export', body: 'Save chats as PDF or Markdown for revision.' },
  { icon: Mic, title: 'Voice input', body: 'Ask questions out loud instead of typing.' },
  { icon: MoonStar, title: 'Light and dark', body: 'Comfortable reading at any time of day.' },
  { icon: Keyboard, title: 'Keyboard shortcuts', body: 'Move fast without leaving the keyboard.' },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-border px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything else you need to study
          </h2>
          <p className="text-pretty leading-relaxed text-muted">
            Small details that make the three modules pleasant to use every day.
          </p>
        </Reveal>

        <Reveal>
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex flex-col gap-3 bg-background p-6">
                <f.icon className="size-5 text-muted" aria-hidden="true" />
                <h3 className="font-medium text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
