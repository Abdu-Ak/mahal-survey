import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';
import { SiteHeader } from '@/components/SiteHeader';
import { isAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function DataLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/admin-login?next=/data');
  return <>
    <SiteHeader compact />
    <nav className="no-print border-b border-slate-200 bg-white">
      <div className="page-shell flex min-h-14 items-center justify-between gap-3">
        <div className="flex items-center gap-4"><Link href="/data" className="font-bold text-emerald-900">കുടുംബങ്ങൾ</Link><Link href="/" className="text-sm text-slate-600 hover:text-emerald-800">രജിസ്ട്രേഷൻ ഫോം</Link></div>
        <LogoutButton />
      </div>
    </nav>
    {children}
  </>;
}
