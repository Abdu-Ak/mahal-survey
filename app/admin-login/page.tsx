'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { Spinner } from '@/components/Spinner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: form.get('password') }), headers: { 'content-type': 'application/json' } });
    if (!response.ok) {
      setError('പാസ്‌വേഡ് തെറ്റാണ്');
      setLoading(false);
      return;
    }
    const next = new URLSearchParams(window.location.search).get('next');
    router.replace(next?.startsWith('/') && !next.startsWith('//') ? next : '/data');
    router.refresh();
  }

  return (
    <>
      <SiteHeader />
      <main className="form-shell flex min-h-[65vh] items-center justify-center py-10">
        <form onSubmit={login} className="section-card w-full max-w-md" noValidate>
          <p className="text-sm font-medium text-emerald-700">സംരക്ഷിത ഭാഗം</p>
          <h1 className="mt-1 text-2xl font-bold text-emerald-950">അഡ്മിൻ ലോഗിൻ</h1>
          <p className="mt-2 text-slate-600">വിവരങ്ങൾ കാണാൻ രഹസ്യ പാസ്‌വേഡ് നൽകുക.</p>
          <div className="mt-6">
            <label className="field-label" htmlFor="password">പാസ്‌വേഡ്</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
          </div>
          {error && <p className="field-error mt-3" role="alert">{error}</p>}
          <button className="primary-button mt-5 w-full" disabled={loading}>{loading && <Spinner />}{loading ? 'പരിശോധിക്കുന്നു…' : 'പ്രവേശിക്കുക'}</button>
        </form>
      </main>
    </>
  );
}
