'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Spinner } from './Spinner';

export function DeleteButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return <button type="button" className={`danger-button ${compact ? 'min-h-9 px-2 py-1 text-xs' : ''}`} disabled={loading} onClick={async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm('ഈ കുടുംബത്തിന്റെ വിവരങ്ങൾ ശാശ്വതമായി ഇല്ലാതാക്കണോ? ഇത് തിരികെ എടുക്കാൻ കഴിയില്ല.')) return;
    setLoading(true);
    const response = await fetch(`/api/households/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      alert('ഇല്ലാതാക്കാനായില്ല. വീണ്ടും ശ്രമിക്കുക.');
      setLoading(false);
      return;
    }
    router.push('/data?deleted=1');
    router.refresh();
  }}>{loading && <Spinner />}{loading ? 'ഇല്ലാതാക്കുന്നു…' : 'ഇല്ലാതാക്കുക'}</button>;
}
