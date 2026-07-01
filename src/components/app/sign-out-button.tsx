'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/utils';

type SignOutButtonProps = {
  className?: string;
  compact?: boolean;
};

export function SignOutButton({ className, compact = false }: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={isSigningOut}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-background-secondary bg-white font-semibold text-slate-600 shadow-sm transition hover:border-terracotta-200 hover:bg-terracotta-50 hover:text-terracotta-700 disabled:cursor-wait disabled:opacity-60',
        compact ? 'px-2.5 py-1.5 text-[10px]' : 'w-full px-3 py-2 text-xs',
        className,
      )}
      aria-label="Sign out of EduClearance"
    >
      {isSigningOut ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
