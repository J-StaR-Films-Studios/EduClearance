'use client';

import { useState } from 'react';

type CopyMessageButtonProps = {
  message: string;
};

export function CopyMessageButton({ message }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={handleCopy} className="text-xs font-bold text-navy-900 hover:underline">
      {copied ? 'Copied' : 'Copy Message'}
    </button>
  );
}
