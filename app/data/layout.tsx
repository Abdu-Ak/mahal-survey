import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardPlus, UsersRound } from 'lucide-react';
import { LogoutButton } from '@/components/LogoutButton';
import { isAdmin } from '@/lib/admin-auth';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function DataLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/admin-login?next=/data');
  return <>
    <header className="admin-topbar no-print">
      <div className="page-shell admin-topbar-inner">
        <Link href="/data" className="admin-brand">
          <span className="admin-brand-mark"><UsersRound aria-hidden="true" size={20} /></span>
          <span className="min-w-0">
            <span className="admin-brand-title"><span className="sm:hidden">മഹല്ല് അഡ്മിൻ</span><span className="hidden sm:inline">{config.committeeName}</span></span>
            <span className="admin-brand-subtitle">കുടുംബ വിവരശേഖരം</span>
          </span>
        </Link>
        <nav className="admin-nav" aria-label="അഡ്മിൻ നാവിഗേഷൻ">
          <Link href="/data" className="admin-nav-link is-active" aria-current="page"><UsersRound aria-hidden="true" size={18} /><span className="hidden md:inline">കുടുംബങ്ങൾ</span></Link>
          <Link href="/" className="admin-nav-link" title="പുതിയ രജിസ്ട്രേഷൻ"><ClipboardPlus aria-hidden="true" size={18} /><span className="hidden md:inline">പുതിയ രജിസ്ട്രേഷൻ</span></Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
    {children}
  </>;
}
