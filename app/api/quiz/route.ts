import { generateText, Output } from 'ai';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { CHAT_MODEL } from '@/lib/prompts';

export const maxDuration = 60;

const bodySchema = z.object({
  topic: z.string().trim().min(2).max(300),
  count: z.number().int().min(1).max(30),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
});

const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answerIndex: z.number().int(),
      explanation: z.string(),
    }),
  ),
});

export async function POST(req: Request) {
  const limited = rateLimit(req, 'quiz', 8);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Enter a topic and a question count between 1 and 30.' }, { status: 400 });

  const { topic, count, difficulty } = parsed.data;

  try {
    const { output } = await generateText({
      model: CHAT_MODEL,
      output: Output.object({ schema: quizSchema }),
      system: `You write accurate multiple-choice test questions for students.
Rules:
- Exactly ${count} questions, each with exactly 4 distinct options.
- Exactly one option is correct; answerIndex is its 0-based position. Vary the correct position across questions.
- Distractors must be plausible, not jokes. Do not use "All of the above" or "None of the above".
- Difficulty: ${difficulty}. Cover different sub-topics rather than repeating one idea.
- explanation: 1-2 sentences on why the correct answer is right.
- Plain text only, no markdown or LaTeX.`,
      prompt: `Topic: ${topic}`,
    });

    const questions = (output?.questions ?? [])
      .filter((q) => q.options.length >= 2 && q.answerIndex >= 0 && q.answerIndex < q.options.length)
      .slice(0, count)
      .map((q, i) => ({ id: i, question: q.question, options: q.options.slice(0, 4), answerIndex: q.answerIndex, explanation: q.explanation }))
      .filter((q) => q.answerIndex < q.options.length);

    if (questions.length === 0) return Response.json({ error: 'Could not generate questions. Try a different topic.' }, { status: 502 });
    return Response.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (/credit card/i.test(message)) {
      return Response.json(
        { error: 'AI Gateway needs a credit card on the Vercel account to unlock free credits.' },
        { status: 402 },
      );
    }
    return Response.json({ error: 'The test could not be generated. Please try again.' }, { status: 500 });
  }
}
