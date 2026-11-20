'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  return <button className="secondary-button min-h-10 px-3 py-1 text-sm" onClick={async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin-login');
    router.refresh();
  }}>പുറത്തുകടക്കുക</button>;
}
