import { Reveal } from './reveal';

const STACK = ['Next.js', 'Vercel AI SDK', 'Gemini via AI Gateway', 'YouTube Data API'];

export function About() {
  return (
    <section id="about" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-5">
        <Reveal className="flex flex-col gap-5 md:col-span-3">
          <p className="hud text-accent">Mission</p>
          <h2 className="text-gold text-balance font-display text-3xl font-semibold sm:text-5xl">
            Pull every resource into a single point.
          </h2>
          <p className="text-pretty leading-relaxed text-muted">
            Studying means juggling a textbook, a lecture tab, lecture notes, and a search engine. EVENT HORIZON AI
            collapses them into one workspace: explanations that build intuition first, answers grounded in your own
            documents, and lectures that actually exist, ordered so you can learn them in sequence.
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Tech stack">
            {STACK.map((s) => (
              <li key={s} className="rounded-full border border-primary/40 px-3 py-1 font-mono text-xs text-primary-2">
                {s}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="md:col-span-2">
          <div className="glass flex h-full flex-col justify-between gap-8 rounded-2xl p-6">
            <p className="hud text-muted">Built by</p>
            <div className="flex flex-col gap-1">
              <p className="font-display text-2xl font-semibold">Your Name</p>
              <p className="text-sm leading-relaxed text-muted">
                Student, developer, and occasional stargazer. Replace this card with your own story.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
