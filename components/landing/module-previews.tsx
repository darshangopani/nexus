import { FileText, Play } from 'lucide-react';

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-xs font-medium text-muted">{title}</span>
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-foreground/15" />
          <span className="size-2 rounded-full bg-foreground/15" />
          <span className="size-2 rounded-full bg-foreground/15" />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:p-6">{children}</div>
    </div>
  );
}

export function TheoryPreview() {
  return (
    <Frame title="Theory Tutor">
      <div className="ml-auto max-w-xs rounded-lg bg-foreground/5 px-4 py-2.5 text-sm text-foreground">
        Why does time slow down near a black hole?
      </div>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/85">
        <p>
          <span className="font-semibold text-foreground">Short answer:</span> gravity bends spacetime, and clocks
          deeper in a gravitational well tick slower relative to distant observers.
        </p>
        <div className="rounded-lg border border-border px-4 py-3 font-mono text-xs text-foreground">
          {'t_0 = t_f · √(1 − 2GM / rc²)'}
        </div>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-muted">
          <li>Mass curves spacetime around it.</li>
          <li>Closer to the mass, the curvature is stronger.</li>
          <li>{'At r = 2GM/c², time appears to stop.'}</li>
        </ol>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <span className="rounded-md border border-border px-2.5 py-1 text-xs text-muted">Take a quiz</span>
        <span className="rounded-md border border-border px-2.5 py-1 text-xs text-muted">Explain simpler</span>
      </div>
    </Frame>
  );
}

export function PdfPreview() {
  return (
    <Frame title="PDF Chat">
      <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
        <FileText className="size-5 text-muted" />
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-foreground">Thermodynamics_Notes.pdf</span>
          <span className="text-xs text-muted">84 pages · indexed</span>
        </div>
      </div>
      <div className="ml-auto max-w-xs rounded-lg bg-foreground/5 px-4 py-2.5 text-sm text-foreground">
        Summarise the second law in two lines.
      </div>
      <p className="text-sm leading-relaxed text-foreground/85">
        The total entropy of an isolated system never decreases over time. Heat flows on its own only from hotter to
        colder bodies.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-md bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent">p. 23</span>
        <span className="rounded-md bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent">p. 27</span>
      </div>
    </Frame>
  );
}

const LECTURES = [
  { title: 'Fourier Transform, Visually Explained', channel: '3Blue1Brown', time: '20:57', level: 'Beginner' },
  { title: 'Signals and Systems, Lecture 8', channel: 'MIT OpenCourseWare', time: '51:12', level: 'Intermediate' },
  { title: 'The FFT Algorithm', channel: 'Reducible', time: '28:23', level: 'Advanced' },
];

export function LecturePreview() {
  return (
    <Frame title="Lecture Finder">
      <div className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted">Fourier transform</div>
      <ul className="flex flex-col divide-y divide-border">
        {LECTURES.map((l) => (
          <li key={l.title} className="flex items-center gap-4 py-3">
            <div className="flex aspect-video w-24 shrink-0 items-center justify-center rounded-md bg-foreground/5">
              <Play className="size-4 text-muted" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">{l.title}</span>
              <span className="text-xs text-muted">
                {l.channel} · {l.time}
              </span>
            </div>
            <span className="hidden text-xs text-muted sm:block">{l.level}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
