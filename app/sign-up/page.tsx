import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata: Metadata = { title: 'Create account | EVENT HORIZON AI' };

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect('/chat');
  return <AuthForm mode="sign-up" />;
}
