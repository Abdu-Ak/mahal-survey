'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();
  return <button className="secondary-button icon-button" aria-label="പുറത്തുകടക്കുക" title="പുറത്തുകടക്കുക" onClick={async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin-login');
    router.refresh();
  }}><LogOut aria-hidden="true" size={19} strokeWidth={2} /></button>;
}
