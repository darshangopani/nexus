import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { SignOutButton } from '@/components/auth/sign-out-button';

export const metadata: Metadata = { title: 'Settings | EVENT HORIZON AI' };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');
  const { name, email, createdAt } = session.user;

  return (
    <main className="min-h-svh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Link href="/chat" className="flex items-center gap-1.5 self-start text-sm text-muted hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to workspace
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        </div>

        <section aria-labelledby="account-heading" className="flex flex-col rounded-2xl border border-border">
          <h2 id="account-heading" className="border-b border-border px-5 py-4 text-sm font-medium">
            Account
          </h2>
          <dl className="flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 text-sm">
              <dt className="text-muted">Name</dt>
              <dd className="truncate">{name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 text-sm">
              <dt className="text-muted">Email</dt>
              <dd className="truncate">{email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
              <dt className="text-muted">Member since</dt>
              <dd>{new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="session-heading" className="flex flex-col gap-4 rounded-2xl border border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 id="session-heading" className="text-sm font-medium">Sign out</h2>
            <p className="text-sm leading-relaxed text-muted">End your session on this device.</p>
          </div>
          <SignOutButton />
        </section>
      </div>
    </main>
  );
}
