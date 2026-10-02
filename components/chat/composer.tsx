'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic, MicOff, Square } from 'lucide-react';
import { toast } from 'sonner';

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function Composer({
  onSend,
  onStop,
  busy,
  disabled,
  placeholder,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  busy: boolean;
  disabled?: boolean;
  placeholder: string;
}) {
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => () => recRef.current?.stop(), []);

  function submit() {
    const text = value.trim();
    if (!text || busy || disabled) return;
    onSend(text);
    setValue('');
  }

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }
    const rec = new Ctor();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = false;
    rec.continuous = false;
    const base = value;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results, (r) => r[0].transcript).join(' ');
      setValue(base ? `${base} ${transcript}` : transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="glass gradient-border flex items-end gap-2 rounded-2xl p-2"
    >
      <label htmlFor="composer" className="sr-only">
        Message
      </label>
      <textarea
        id="composer"
        ref={areaRef}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-50 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed outline-none placeholder:text-muted disabled:opacity-50"
      />
      <button
        type="button"
        onClick={toggleVoice}
        aria-label={listening ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={listening}
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
          listening ? 'bg-primary/20 text-primary' : 'text-muted hover:bg-foreground/5 hover:text-foreground'
        }`}
      >
        {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </button>
      {busy ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop generating"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/10 text-foreground hover:bg-foreground/15"
        >
          <Square className="size-3.5 fill-current" />
        </button>
      ) : (
        <button
          type="submit"
          aria-label="Send message"
          disabled={!value.trim() || disabled}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-2 to-primary text-background transition-opacity disabled:opacity-35"
        >
          <ArrowUp className="size-4" />
        </button>
      )}
    </form>
  );
}
