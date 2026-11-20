import { config } from '@/lib/config';

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="border-b border-emerald-900/10 bg-white/90 backdrop-blur">
      <div className={`${compact ? 'page-shell' : 'form-shell'} py-5 text-center`}>
        <p className="text-lg font-bold text-emerald-900 md:text-xl">{config.committeeName}</p>
        {!compact && <p className="mt-1 text-sm text-slate-600 md:text-base">{config.address}</p>}
        {!compact && <p className="mt-1 text-sm font-medium text-emerald-800">{config.phones.join(' · ')}</p>}
      </div>
    </header>
  );
}
