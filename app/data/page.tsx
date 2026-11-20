import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download, Pencil, Search, SearchX, ShieldCheck, UsersRound, X } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';
import { DeleteButton } from '@/components/DeleteButton';
import { isAdmin } from '@/lib/admin-auth';
import { queryHouseholds } from '@/lib/queries';
import { filterSchema, type Filters } from '@/lib/schema';
import { publicPhotoUrl } from '@/lib/supabase';
import type { Household } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Search = Record<string, string | string[] | undefined>;

function stringParams(search: Search) {
  return Object.fromEntries(Object.entries(search).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
}

function urlFor(filters: Record<string, string | number | undefined>, overrides: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...overrides })) if (value !== undefined && value !== '' && !(key === 'sort' && value === 'new') && !(key === 'page' && Number(value) === 1)) params.set(key, String(value));
  return `?${params.toString()}`;
}

function memberCount(household: Household) {
  const first = Array.isArray(household.members) ? household.members[0] : undefined;
  return first && 'count' in first ? first.count : 0;
}

export default async function DataPage({ searchParams }: { searchParams: Promise<Search> }) {
  if (!(await isAdmin())) redirect('/admin-login?next=/data');
  const raw = stringParams(await searchParams);
  const parsed = filterSchema.parse(raw);
  const filters: Filters = { ...parsed, house_type: undefined, illness: undefined, aid: undefined, blood: undefined, sort: 'new' };
  const { households, filteredCount, totalCount, pageSize } = await queryHouseholds(filters);
  const filterValues = { q: filters.q, from: filters.from, to: filters.to, page: filters.page };
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filterValues)) if (key !== 'page' && value !== undefined && value !== '') exportParams.set(key, String(value));
  const pages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const date = (value: string) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }).format(new Date(value));
  const active = [filters.q && `തിരയുക: ${filters.q}`, (filters.from || filters.to) && `തീയതി: ${filters.from ?? '…'} – ${filters.to ?? '…'}`].filter(Boolean);

  return <main className="page-shell admin-main">
    <section className="data-hero">
      <div className="min-w-0">
        <p className="data-eyebrow"><ShieldCheck aria-hidden="true" size={16} />സുരക്ഷിത അഡ്മിൻ</p>
        <h1 className="data-page-title">കുടുംബ രജിസ്റ്റർ</h1>
        <div className="data-stat"><UsersRound aria-hidden="true" size={17} /><span>ആകെ കുടുംബങ്ങൾ</span><strong>{totalCount}</strong></div>
      </div>
      <a className="primary-button export-button" href={`/api/export${exportParams.size ? `?${exportParams}` : ''}`}><Download aria-hidden="true" size={19} /><span>എക്സൽ ഡൗൺലോഡ്</span><span className="export-count">{filteredCount}</span></a>
    </section>
    {raw.deleted === '1' && <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">ഇല്ലാതാക്കി</p>}
    <section className="data-filter-card"><FilterForm filters={filters} /></section>
    <div className="data-result-bar"><p>കാണുന്ന ഫലങ്ങൾ: <strong>{filteredCount}</strong></p>{active.length > 0 && <div className="flex flex-wrap gap-2">{active.map((value) => <span className="chip" key={String(value)}>{value}</span>)}</div>}</div>

    {households.length === 0 ? <section className="data-empty-state"><span className="data-empty-icon"><SearchX aria-hidden="true" size={24} /></span><h2>വിവരങ്ങൾ ഒന്നുമില്ല</h2><p>തിരയൽ മാറ്റുകയോ പുതിയ രജിസ്ട്രേഷൻ ചേർക്കുകയോ ചെയ്യാം.</p></section> : <>
      <div className="mt-5 space-y-3 md:hidden">{households.map((household) => <article className="section-card p-4" key={household.id}>
        <Link href={`/data/${household.id}`} className="flex gap-4">
          <img src={publicPhotoUrl(household.photo_path)} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-slate-100 object-cover" />
          <div className="min-w-0"><p className="text-xs font-medium text-emerald-700">നമ്പർ {household.serial_no}</p><h2 className="truncate text-lg font-bold text-emerald-950">{household.head_name}</h2><p className="truncate text-slate-600">{household.house_name}</p><p className="text-sm text-slate-600">{household.phone} · അംഗങ്ങൾ {memberCount(household)}</p></div>
        </Link>
        <div className="mt-3 flex justify-end gap-2"><Link href={`/data/${household.id}/edit`} className="secondary-button icon-button table-action-button" aria-label="തിരുത്തുക" title="തിരുത്തുക"><Pencil aria-hidden="true" size={18} /></Link><DeleteButton id={household.id} compact /></div>
      </article>)}</div>
      <div className="section-card mt-5 hidden overflow-x-auto p-0 md:block"><table className="data-table"><thead><tr><th>നമ്പർ</th><th>ഫോട്ടോ</th><th>കുടുംബനാഥൻ</th><th>വീട്ടുപേര്</th><th>ഫോൺ</th><th>അംഗങ്ങൾ</th><th>തീയതി</th><th><span className="sr-only">പ്രവർത്തനങ്ങൾ</span></th></tr></thead><tbody>{households.map((household) => <tr key={household.id}><td>{household.serial_no}</td><td><img src={publicPhotoUrl(household.photo_path)} alt="" className="h-12 w-12 rounded-lg object-cover" /></td><td><Link className="font-bold text-emerald-900 hover:underline" href={`/data/${household.id}`}>{household.head_name}</Link></td><td>{household.house_name}</td><td>{household.phone}</td><td>{memberCount(household)}</td><td className="whitespace-nowrap">{date(household.submitted_at)}</td><td><div className="flex gap-2"><Link href={`/data/${household.id}/edit`} className="secondary-button icon-button table-action-button" aria-label="തിരുത്തുക" title="തിരുത്തുക"><Pencil aria-hidden="true" size={18} /></Link><DeleteButton id={household.id} compact /></div></td></tr>)}</tbody></table></div>
    </>}
    {pages > 1 && <nav className="mt-6 flex items-center justify-center gap-3" aria-label="പേജുകൾ">{filters.page > 1 && <Link className="secondary-button" href={urlFor(filterValues, { page: filters.page - 1 })}>മുമ്പത്തെ</Link>}<span>പേജ് {filters.page} / {pages}</span>{filters.page < pages && <Link className="secondary-button" href={urlFor(filterValues, { page: filters.page + 1 })}>അടുത്തത്</Link>}</nav>}
  </main>;
}

function FilterForm({ filters }: { filters: Filters }) {
  return <form method="get" className="data-filter-form">
    <div>
      <label className="field-label" htmlFor="q">തിരയുക</label>
      <div className="search-field"><Search aria-hidden="true" size={19} /><input className="search-input" id="q" name="q" defaultValue={filters.q} placeholder="പേര് / വീട്ടുപേര് / ഫോൺ തിരയുക" /></div>
    </div>
    <div><label className="field-label">തീയതി പരിധി</label><DateRangePicker from={filters.from} to={filters.to} /></div>
    <div className="filter-actions">
      <button className="primary-button" type="submit"><Search aria-hidden="true" size={18} />തിരയുക</button>
      <Link href="/data" className="secondary-button icon-button" aria-label="തിരയൽ മായ്ക്കുക" title="തിരയൽ മായ്ക്കുക"><X aria-hidden="true" size={20} /></Link>
    </div>
  </form>;
}
