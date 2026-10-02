import { BookOpen, FileText, PlaySquare } from 'lucide-react';
import { Reveal } from './reveal';

const MODULES = [
  {
    icon: BookOpen,
    tag: 'Mode A',
    title: 'Theory Tutor',
    body: 'Ask any concept and get step-by-step explanations, analogies, formulas, and quizzes.',
  },
  {
    icon: FileText,
    tag: 'Mode B',
    title: 'PDF Intelligence',
    body: 'Upload notes, textbooks, or papers, then chat with them and get summaries with page-referenced answers.',
  },
  {
    icon: PlaySquare,
    tag: 'Mode C',
    title: 'Lecture Finder',
    body: 'Enter any topic and get curated YouTube lectures with title, channel, duration, and thumbnail.',
  },
];

const CHIPS = [
  'Streaming responses',
  'Markdown + LaTeX math',
  'Code highlighting',
  'Chat history',
  'Dark / light toggle',
  'Export as PDF / Markdown',
  'Voice input',
  'Keyboard shortcuts',
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <Reveal className="flex flex-col gap-3">
          <p className="hud text-accent">Core modules</p>
          <h2 className="text-gold text-balance font-display text-3xl font-semibold sm:text-5xl">
            Three instruments, one orbit.
          </h2>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.08}>
              <article className="glass glow-hover flex h-full flex-col gap-5 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <m.icon className="size-6 text-primary-2" aria-hidden="true" />
                  <span className="hud text-muted">{m.tag}</span>
                </div>
                <h3 className="font-display text-xl font-semibold">{m.title}</h3>
                <p className="text-pretty leading-relaxed text-muted">{m.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <ul className="flex flex-wrap gap-2" aria-label="Additional features">
            {CHIPS.map((c) => (
              <li key={c} className="glass glow-hover rounded-full px-4 py-2 font-mono text-xs text-foreground/80">
                {c}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
