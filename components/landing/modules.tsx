import Link from 'next/link';
import { ArrowRight, BookOpen, Check, FileText, PlaySquare, type LucideIcon } from 'lucide-react';
import { Reveal } from './reveal';
import { TheoryPreview, PdfPreview, LecturePreview } from './module-previews';

type Module = {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
  body: string;
  points: string[];
  cta: string;
  Preview: () => React.JSX.Element;
};

const MODULES: Module[] = [
  {
    id: 'theory',
    icon: BookOpen,
    label: 'Theory Tutor',
    title: 'Understand concepts, not just answers.',
    body: 'Ask about any topic and get a clear, step-by-step explanation with worked examples, formulas rendered properly, and a short quiz to check yourself.',
    points: ['Step-by-step breakdowns', 'LaTeX math and code blocks', 'Auto-generated practice quizzes'],
    cta: 'Ask a question',
    Preview: TheoryPreview,
  },
  {
    id: 'pdf',
    icon: FileText,
    label: 'PDF Chat',
    title: 'Talk to your notes and textbooks.',
    body: 'Upload lecture notes, papers, or a full textbook. Get summaries and answers that point back to the exact page they came from.',
    points: ['Page-referenced answers', 'Chapter and section summaries', 'Multiple PDFs in one chat'],
    cta: 'Upload a PDF',
    Preview: PdfPreview,
  },
  {
    id: 'lectures',
    icon: PlaySquare,
    label: 'Lecture Finder',
    title: 'The right lecture, without the searching.',
    body: 'Enter a topic and get a short list of relevant YouTube lectures with channel, duration, and level, so you can start watching instead of scrolling.',
    points: ['Curated YouTube results', 'Duration and difficulty at a glance', 'Save lectures to a playlist'],
    cta: 'Find lectures',
    Preview: LecturePreview,
  },
];

export function Modules() {
  return (
    <div className="flex flex-col">
      {MODULES.map((m, i) => (
        <section
          key={m.id}
          id={m.id}
          aria-labelledby={`${m.id}-title`}
          className="scroll-mt-16 border-t border-border px-4 py-20 sm:px-6 lg:py-28"
        >
          <div
            className={`mx-auto flex max-w-6xl flex-col gap-12 lg:items-center lg:gap-20 ${
              i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
            }`}
          >
            <Reveal className="flex flex-col gap-6 lg:w-5/12">
              <div className="flex items-center gap-2 text-muted">
                <m.icon className="size-4" aria-hidden="true" />
                <span className="text-sm font-medium">{m.label}</span>
              </div>
              <h2
                id={`${m.id}-title`}
                className="text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl"
              >
                {m.title}
              </h2>
              <p className="text-pretty leading-relaxed text-muted">{m.body}</p>
              <ul className="flex flex-col gap-3">
                {m.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-sm text-foreground/90">
                    <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href="/chat"
                className="group flex w-fit items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                {m.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </Reveal>

            <Reveal delay={0.1} className="lg:w-7/12">
              <m.Preview />
            </Reveal>
          </div>
        </section>
      ))}
    </div>
  );
}
