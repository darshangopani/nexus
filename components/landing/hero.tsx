import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-24">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0c0c0d] via-[#0c0c0d]/60 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <h1 className="max-w-3xl text-balance font-display text-5xl font-semibold leading-none tracking-tight text-[#ecebe8] sm:text-7xl">
          Ask. Upload. Learn.
        </h1>
        <p className="max-w-xl text-pretty text-base leading-relaxed text-[#ecebe8]/70 sm:text-lg">
          An AI study companion that explains theory, reads your PDFs, and finds the best YouTube lectures for any
          topic.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/chat"
            className="group flex items-center gap-2 rounded-full bg-[#ecebe8] px-6 py-3 text-sm font-semibold text-[#0c0c0d] transition-colors hover:bg-[#ecebe8]/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecebe8]"
          >
            Launch Chat
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a
            href="#theory"
            className="rounded-full border border-[#ecebe8]/20 px-6 py-3 text-sm font-medium text-[#ecebe8] transition-colors hover:border-[#ecebe8]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecebe8]"
          >
            Explore modules
          </a>
        </div>
      </div>
    </section>
  );
}
