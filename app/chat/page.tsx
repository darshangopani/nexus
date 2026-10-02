import type { Metadata } from 'next';
import { ChatLoader } from '@/components/chat/chat-loader';

export const metadata: Metadata = {
  title: 'Chat | EVENT HORIZON AI',
  description: 'Theory tutor, PDF chat, and YouTube lecture finder in one workspace.',
};

export default function ChatPage() {
  return <ChatLoader />;
}
