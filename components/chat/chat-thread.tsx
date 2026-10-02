'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Check, Copy, Download, FileDown, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Markdown } from './markdown';
import { Composer } from './composer';
import { PdfUploader, PdfViewer } from './pdf-panel';
import type { ChatSession } from '@/lib/types';
import type { Difficulty } from '@/lib/prompts';

const THEORY_STARTERS = [
  'Explain gradient descent with an analogy',
  'What is a Fourier transform?',
  'Quiz me on Newton\u2019s laws',
  'Derive the quadratic formula',
];
const PDF_STARTERS = ['Summarize this document', 'List the key definitions', 'Make 5 flashcards from chapter 1'];

function messageText(m: UIMessage) {
  return m.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function readError(error: Error | undefined) {
  if (!error) return null;
  try {
    return (JSON.parse(error.message) as { error?: string }).error ?? error.message;
  } catch {
    return error.message || 'Something went wrong.';
  }
}

export function ChatThread({
  session,
  onChange,
  registerStop,
}: {
  session: ChatSession;
  onChange: (patch: Partial<ChatSession>) => void;
  registerStop: (stop: () => void) => void;
}) {
  const isPdf = session.mode === 'pdf';
  const settings = useRef(session);
  settings.current = session;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          mode: settings.current.mode,
          difficulty: settings.current.difficulty,
          eli12: settings.current.eli12,
          docIds: settings.current.docs.map((d) => d.id),
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, regenerate, error } = useChat({
    id: session.id,
    messages: session.messages,
    transport,
  });

  const busy = status === 'submitted' || status === 'streaming';
  const [viewer, setViewer] = useState<{ id: string; page: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => registerStop(stop), [registerStop, stop]);

  useEffect(() => {
    if (status !== 'ready' || messages.length === 0) return;
    const first = messages.find((m) => m.role === 'user');
    onChange({
      messages,
      title: first ? messageText(first).slice(0, 60) : session.title,
      updatedAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const errorText = readError(error);
  useEffect(() => {
    if (errorText) toast.error(errorText);
  }, [errorText]);

  function send(text: string) {
    if (isPdf && session.docs.length === 0) {
      toast.error('Upload a PDF first.');
      return;
    }
    sendMessage({ text });
  }

  function cite(page: number, docName?: string) {
    const doc = (docName && session.docs.find((d) => d.name.startsWith(docName))) || session.docs[0];
    if (doc) setViewer({ id: doc.id, page });
  }

  function exportMarkdown() {
    const md = messages
      .map((m) => `## ${m.role === 'user' ? 'You' : 'Event Horizon AI'}\n\n${messageText(m)}`)
      .join('\n\n---\n\n');
    const url = URL.createObjectURL(new Blob([`# ${session.title}\n\n${md}`], { type: 'text/markdown' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${session.title.slice(0, 40) || 'chat'}.md` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy(m: UIMessage) {
    await navigator.clipboard.writeText(messageText(m));
    setCopied(m.id);
    setTimeout(() => setCopied(null), 1500);
  }

  const viewerDoc = viewer ? session.docs.find((d) => d.id === viewer.id) : undefined;
  const starters = isPdf ? PDF_STARTERS : THEORY_STARTERS;

  return (
    <div className={`grid min-h-0 flex-1 gap-4 ${viewerDoc ? 'lg:grid-cols-2' : ''}`}>
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {isPdf ? (
            <p className="text-sm text-muted">Answers are grounded in your documents with page citations.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div role="radiogroup" aria-label="Difficulty" className="glass flex rounded-full p-0.5">
                {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={session.difficulty === d}
                    onClick={() => onChange({ difficulty: d })}
                    className={`rounded-full px-3 py-1 text-xs capitalize transition-colors ${
                      session.difficulty === d ? 'bg-primary/20 text-primary-2' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <label className="glass flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={session.eli12}
                  onChange={(e) => onChange({ eli12: e.target.checked })}
                  className="accent-[var(--accent)]"
                />
                {"Explain like I'm 12"}
              </label>
            </div>
          )}
          {messages.length > 0 && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={exportMarkdown} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-foreground/5 hover:text-foreground">
                <Download className="size-3.5" aria-hidden="true" /> Markdown
              </button>
              <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-foreground/5 hover:text-foreground">
                <FileDown className="size-3.5" aria-hidden="true" /> PDF
              </button>
            </div>
          )}
        </div>

        {isPdf && (
          <PdfUploader
            docs={session.docs}
            activeId={viewer?.id}
            onAdd={(doc) => onChange({ docs: [...settings.current.docs, doc] })}
            onRemove={(id) => {
              onChange({ docs: settings.current.docs.filter((d) => d.id !== id) });
              if (viewer?.id === id) setViewer(null);
            }}
            onSelect={(id) => setViewer({ id, page: 1 })}
          />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-10 text-center">
              <div className="flex flex-col gap-2">
                <p className="hud text-accent">{isPdf ? 'PDF Intelligence' : 'Theory Tutor'}</p>
                <h2 className="text-gold text-balance font-display text-2xl font-semibold sm:text-3xl">
                  {isPdf ? 'Ask your documents anything.' : 'What do you want to understand?'}
                </h2>
              </div>
              <ul className="flex max-w-xl flex-wrap justify-center gap-2">
                {starters.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => send(s)}
                      className="glass glow-hover rounded-full px-4 py-2 text-sm text-foreground/80"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol id="print-area" className="flex flex-col gap-6 py-2">
              {messages.map((m, i) => {
                const text = messageText(m);
                const isLast = i === messages.length - 1;
                return (
                  <li key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex flex-col gap-2'}>
                    {m.role === 'user' ? (
                      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary/15 px-4 py-2.5 leading-relaxed">
                        {text}
                      </p>
                    ) : (
                      <>
                        <span className="hud text-muted">Event Horizon AI</span>
                        {text ? (
                          <Markdown text={text} onCite={isPdf ? cite : undefined} />
                        ) : (
                          <span className="size-2 animate-pulse rounded-full bg-accent" aria-label="Thinking" />
                        )}
                        {!(busy && isLast) && text && (
                          <div className="flex gap-1 print:hidden">
                            <button type="button" onClick={() => copy(m)} aria-label="Copy answer" className="rounded-md p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground">
                              {copied === m.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                            </button>
                            {isLast && (
                              <button type="button" onClick={() => regenerate()} aria-label="Regenerate answer" className="rounded-md p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground">
                                <RotateCcw className="size-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
              {status === 'submitted' && (
                <li className="flex items-center gap-2 text-sm text-muted">
                  <span className="size-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
                  Thinking
                </li>
              )}
            </ol>
          )}
          <div ref={endRef} />
        </div>

        <Composer
          onSend={send}
          onStop={stop}
          busy={busy}
          disabled={isPdf && session.docs.length === 0}
          placeholder={isPdf ? (session.docs.length ? 'Ask about your PDFs' : 'Upload a PDF to start') : 'Ask any concept'}
        />
      </div>

      {viewerDoc && viewer && <PdfViewer doc={viewerDoc} page={viewer.page} onClose={() => setViewer(null)} />}
    </div>
  );
}
