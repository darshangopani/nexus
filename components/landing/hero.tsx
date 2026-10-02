import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-24">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-xl">
          <span className="size-1.5 animate-pulse rounded-full bg-[#5ee7ff]" />
          <span className="hud text-[#ece8e1]/70">System: Online</span>
        </div>
        <h1 className="text-gold max-w-3xl text-balance font-display text-5xl font-semibold leading-none tracking-tight sm:text-7xl">
          Ask. Upload. Learn.
        </h1>
        <p className="max-w-xl text-pretty text-base leading-relaxed text-[#ece8e1]/75 sm:text-lg">
          An AI study companion that explains theory, reads your PDFs, and finds the best YouTube lectures for any
          topic.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/chat"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffb347] to-[#ff7a18] px-6 py-3 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_40px_-6px_#ff7a18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5ee7ff]"
          >
            Launch Chat
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="rounded-full border border-white/15 bg-black/40 px-6 py-3 text-sm font-medium text-[#ece8e1] backdrop-blur-xl transition-colors hover:border-[#5ee7ff]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5ee7ff]"
          >
            See Features
          </a>
        </div>
        <p className="hud text-[#ece8e1]/40">Scroll to fall in</p>
      </div>
    </section>
  );
}
