import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ChatLoader } from '@/components/chat/chat-loader';

export const metadata: Metadata = {
  title: 'Chat | EVENT HORIZON AI',
  description: 'Theory tutor, PDF chat, and YouTube lecture finder in one workspace.',
};

export default async function ChatPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');
  return <ChatLoader />;
}
