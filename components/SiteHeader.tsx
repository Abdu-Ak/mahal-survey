import { config } from '@/lib/config';

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="border-b border-emerald-900/10 bg-white/90 backdrop-blur">
      <div className={`${compact ? 'page-shell' : 'form-shell'} site-header-content text-center`}>
        <p className="site-header-title font-bold text-emerald-900">{config.committeeName}</p>
        {!compact && <p className="site-header-address mt-1 text-slate-600">{config.address}</p>}
        {!compact && <p className="site-header-phones mt-1 font-medium text-emerald-800">{config.phones.join(' · ')}</p>}
      </div>
    </header>
  );
}
