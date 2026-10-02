'use client';

import { Check, X } from 'lucide-react';
import type { QuizQuestion } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

type Props = {
  index: number;
  question: QuizQuestion;
  selected: number | undefined;
  onSelect: (choice: number) => void;
};

export function QuizQuestionCard({ index, question, selected, onSelect }: Props) {
  const locked = selected !== undefined;
  const isRight = selected === question.answerIndex;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <p className="text-pretty font-medium leading-relaxed">
        <span className="mr-2 font-mono text-sm text-muted">Q{index + 1}.</span>
        {question.question}
      </p>

      <div role="radiogroup" aria-label={`Question ${index + 1} options`} className="grid gap-2 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const correct = locked && i === question.answerIndex;
          const wrong = locked && i === selected && !isRight;
          const state = correct
            ? 'border-correct bg-correct/10 text-foreground'
            : wrong
              ? 'border-wrong bg-wrong/10 text-foreground'
              : locked
                ? 'border-border text-muted opacity-60'
                : 'border-border hover:border-foreground/40 hover:bg-foreground/[0.03]';

          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected === i}
              disabled={locked}
              onClick={() => onSelect(i)}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm leading-relaxed transition-colors ${state}`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs ${
                  correct ? 'border-correct bg-correct text-background' : wrong ? 'border-wrong bg-wrong text-background' : 'border-border'
                }`}
                aria-hidden="true"
              >
                {correct ? <Check className="size-3.5" /> : wrong ? <X className="size-3.5" /> : LETTERS[i]}
              </span>
              <span>{opt}</span>
              {correct && <span className="sr-only">(correct answer)</span>}
              {wrong && <span className="sr-only">(your answer, incorrect)</span>}
            </button>
          );
        })}
      </div>

      {locked && (
        <div
          role="status"
          className={`animate-in fade-in slide-in-from-top-1 rounded-xl border-l-0 px-4 py-3 text-sm leading-relaxed ${
            isRight ? 'bg-correct/10' : 'bg-wrong/10'
          }`}
        >
          <p className={`font-medium ${isRight ? 'text-correct' : 'text-wrong'}`}>
            {isRight ? 'Correct!' : `Incorrect — the answer is ${LETTERS[question.answerIndex]}.`}
          </p>
          <p className="mt-1 text-muted">{question.explanation}</p>
        </div>
      )}
    </li>
  );
}
