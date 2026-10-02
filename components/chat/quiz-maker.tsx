'use client';

import { useState } from 'react';
import { Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { QuizQuestionCard } from './quiz-question';
import type { QuizQuestion } from '@/lib/types';

const PRESETS = [5, 10, 15, 20];
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = (typeof LEVELS)[number];

export function QuizMaker() {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState<Level>('intermediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [testTopic, setTestTopic] = useState('');

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    if (topic.trim().length < 2 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), count, difficulty: level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
      setQuestions(data.questions);
      setAnswers({});
      setTestTopic(topic.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const answered = Object.keys(answers).length;
  const score = questions.filter((q) => answers[q.id] === q.answerIndex).length;
  const finished = questions.length > 0 && answered === questions.length;

  if (questions.length > 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background pb-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="hud text-muted">Test</p>
              <h2 className="truncate text-lg font-semibold">{testTopic}</h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-mono text-sm tabular-nums" aria-live="polite">
                <span className="text-correct">{score}</span>
                <span className="text-muted"> correct · {answered}/{questions.length} answered</span>
              </p>
              <button
                type="button"
                onClick={() => setAnswers({})}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" /> Retake
              </button>
              <button
                type="button"
                onClick={() => setQuestions([])}
                className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
              >
                New test
              </button>
            </div>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </div>
        </div>

        <ol className="flex flex-col gap-4 overflow-y-auto py-5">
          {questions.map((q, i) => (
            <QuizQuestionCard
              key={q.id}
              index={i}
              question={q}
              selected={answers[q.id]}
              onSelect={(choice) => setAnswers((a) => (q.id in a ? a : { ...a, [q.id]: choice }))}
            />
          ))}
          {finished && (
            <li className="flex flex-col items-center gap-2 rounded-2xl border border-border p-6 text-center">
              <p className="hud text-muted">Result</p>
              <p className="text-4xl font-semibold tabular-nums">
                {score}
                <span className="text-muted">/{questions.length}</span>
              </p>
              <p className="text-sm text-muted">
                {score === questions.length ? 'Perfect score.' : `Review the ${questions.length - score} you missed above, then retake.`}
              </p>
            </li>
          )}
        </ol>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <form onSubmit={generate} className="flex w-full max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="hud text-muted">Test maker</p>
          <h2 className="text-balance text-2xl font-semibold sm:text-3xl">Generate a multiple-choice test on any topic.</h2>
          <p className="text-pretty leading-relaxed text-muted">
            Pick an answer and the correct one is revealed instantly, with a short explanation.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="quiz-topic" className="text-sm font-medium">
            Topic
          </label>
          <input
            id="quiz-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Newton's laws, SQL joins"
            maxLength={300}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Number of questions</legend>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                className={`rounded-full border px-4 py-1.5 font-mono text-sm tabular-nums transition-colors ${
                  count === n ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:text-foreground'
                }`}
              >
                {n}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm text-muted">
              <span>Custom</span>
              <input
                type="number"
                min={1}
                max={30}
                value={count}
                onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 font-mono text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Difficulty</legend>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={level === l}
                onClick={() => setLevel(l)}
                className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
                  level === l ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:text-foreground'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-wrong">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || topic.trim().length < 2}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {loading ? `Writing ${count} questions…` : `Generate ${count}-question test`}
        </button>
      </form>
    </div>
  );
}
