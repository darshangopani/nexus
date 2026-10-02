import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { retrieve } from '@/lib/pdf-store';
import { CHAT_MODEL, pdfPrompt, theoryPrompt } from '@/lib/prompts';

export const maxDuration = 60;

const bodySchema = z.object({
  messages: z.array(z.any()).min(1).max(100),
  mode: z.enum(['theory', 'pdf']).default('theory'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  eli12: z.boolean().default(false),
  docIds: z.array(z.string().uuid()).max(10).default([]),
});

function lastUserText(messages: UIMessage[]) {
  const last = [...messages].reverse().find((m) => m.role === 'user');
  return (
    last?.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('\n') ?? ''
  );
}

export async function POST(req: Request) {
  const limited = rateLimit(req, 'chat', 20);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid request.' }, { status: 400 });

  const { mode, difficulty, eli12, docIds } = parsed.data;
  const messages = parsed.data.messages as UIMessage[];

  let system = theoryPrompt(difficulty, eli12);

  if (mode === 'pdf') {
    const query = lastUserText(messages).slice(0, 2000);
    const { found, hits } = await retrieve(docIds, query);
    if (found.length === 0) {
      return Response.json(
        { error: 'Your uploaded documents have expired. Please upload them again.' },
        { status: 410 },
      );
    }
    const context = hits.map((h) => `[${h.doc} p. ${h.page}]\n${h.text}`).join('\n\n---\n\n');
    system = pdfPrompt(context, found.map((d) => d.name));
  }

  const result = streamText({
    model: CHAT_MODEL,
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => {
      const message = err instanceof Error ? err.message : '';
      if (/credit card/i.test(message)) {
        return 'AI Gateway needs a credit card on the Vercel account to unlock free credits. Add one in Vercel → AI Gateway, then try again.';
      }
      return 'The model could not finish this answer. Please try again.';
    },
  });
}
