'use client';

import { motion, useReducedMotion } from 'motion/react';

const STEPS = [
  { title: 'Choose a mode', body: 'Theory Tutor, PDF Chat, or Lecture Finder: pick the instrument for the job.' },
  { title: 'Ask or upload', body: 'Type a question, drop in your PDFs, or enter a topic you want to master.' },
  { title: 'Learn and save', body: 'Read streamed answers, take quizzes, export chats, and save lecture playlists.' },
];

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <div className="flex flex-col gap-3">
          <p className="hud text-accent">Trajectory</p>
          <h2 className="text-gold text-balance font-display text-3xl font-semibold sm:text-5xl">How it works</h2>
        </div>

        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          <motion.div
            aria-hidden="true"
            className="absolute left-4 right-4 top-4 hidden h-px origin-left bg-border md:block"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              className="relative flex flex-col gap-3"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.25 }}
            >
              <span className="relative z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-foreground">
                {i + 1}
              </span>
              <h3 className="font-display text-lg font-semibold">{s.title}</h3>
              <p className="max-w-xs text-pretty leading-relaxed text-muted">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
