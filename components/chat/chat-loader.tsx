'use client';

import dynamic from 'next/dynamic';

// The workspace reads localStorage and document state on first render, so it's client-only.
const ChatApp = dynamic(() => import('./chat-app').then((m) => m.ChatApp), {
  ssr: false,
  loading: () => <div className="h-svh bg-background" />,
});

export function ChatLoader() {
  return <ChatApp />;
}
