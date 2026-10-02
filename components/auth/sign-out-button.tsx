'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-xl border border-wrong/40 px-4 py-2 text-sm font-medium text-wrong transition-colors hover:bg-wrong/10 disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
