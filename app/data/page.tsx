import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DeleteButton } from '@/components/DeleteButton';
import { isAdmin } from '@/lib/admin-auth';
import { bloodGroups, houseTypeLabels } from '@/lib/config';
import { queryHouseholds } from '@/lib/queries';
import { filterSchema } from '@/lib/schema';
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
  const filters = filterSchema.parse(raw);
  const { households, filteredCount, totalCount, pageSize } = await queryHouseholds(filters);
  const filterValues = { q: filters.q, house_type: filters.house_type, illness: filters.illness, aid: filters.aid, blood: filters.blood, from: filters.from, to: filters.to, sort: filters.sort, page: filters.page };
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filterValues)) if (key !== 'page' && value !== undefined && value !== '' && !(key === 'sort' && value === 'new')) exportParams.set(key, String(value));
  const pages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const date = (value: string) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }).format(new Date(value));
  const active = [filters.q && `തിരയുക: ${filters.q}`, filters.house_type && `വീട്: ${houseTypeLabels[filters.house_type]}`, filters.illness && `നിത്യരോഗികൾ: ${filters.illness === 'yes' ? 'ഉണ്ട്' : 'ഇല്ല'}`, filters.aid && `സഹായം: ${filters.aid === 'yes' ? 'ഉണ്ട്' : 'ഇല്ല'}`, filters.blood && `ബ്ലഡ്: ${filters.blood}`, filters.from && `മുതൽ: ${filters.from}`, filters.to && `വരെ: ${filters.to}`].filter(Boolean);

  return <main className="page-shell py-7 md:py-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-emerald-700">മഹല്ല് വിവരശേഖരം</p><h1 className="text-2xl font-bold text-emerald-950 md:text-3xl">രജിസ്റ്റർ ചെയ്ത കുടുംബങ്ങൾ</h1><p className="mt-1 text-slate-600">ആകെ കുടുംബങ്ങൾ: {totalCount}</p></div>
      <a className="primary-button" href={`/api/export${exportParams.size ? `?${exportParams}` : ''}`}>എക്സൽ ഡൗൺലോഡ് ({filteredCount})</a>
    </div>
    {raw.deleted === '1' && <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">ഇല്ലാതാക്കി</p>}
    <details className="section-card mt-6 md:hidden"><summary className="cursor-pointer font-bold text-emerald-900">ഫിൽട്ടർ</summary><FilterForm filters={filters} /></details>
    <section className="section-card mt-6 hidden md:block"><FilterForm filters={filters} /></section>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="font-medium">ഫലം: {filteredCount} / ആകെ {totalCount}</p>{active.length > 0 && <div className="flex flex-wrap gap-2">{active.map((value) => <span className="chip" key={String(value)}>{value}</span>)}</div>}</div>

    {households.length === 0 ? <section className="section-card mt-5 py-14 text-center text-slate-600">വിവരങ്ങൾ ഒന്നുമില്ല</section> : <>
      <div className="mt-5 space-y-3 md:hidden">{households.map((household) => <article className="section-card p-4" key={household.id}>
        <Link href={`/data/${household.id}`} className="flex gap-4">
          <img src={publicPhotoUrl(household.photo_path)} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-slate-100 object-cover" />
          <div className="min-w-0"><p className="text-xs font-medium text-emerald-700">നമ്പർ {household.serial_no}</p><h2 className="truncate text-lg font-bold text-emerald-950">{household.head_name}</h2><p className="truncate text-slate-600">{household.house_name}</p><p className="text-sm text-slate-600">{household.phone} · അംഗങ്ങൾ {memberCount(household)}</p></div>
        </Link>
        <div className="mt-3 flex gap-2"><Link href={`/data/${household.id}/edit`} className="secondary-button min-h-9 flex-1 py-1 text-sm">തിരുത്തുക</Link><DeleteButton id={household.id} compact /></div>
      </article>)}</div>
      <div className="section-card mt-5 hidden overflow-x-auto p-0 md:block"><table className="data-table"><thead><tr><th>നമ്പർ</th><th>ഫോട്ടോ</th><th>കുടുംബനാഥൻ</th><th>വീട്ടുപേര്</th><th>ഫോൺ</th><th>അംഗങ്ങൾ</th><th>തീയതി</th><th><span className="sr-only">പ്രവർത്തനങ്ങൾ</span></th></tr></thead><tbody>{households.map((household) => <tr key={household.id}><td>{household.serial_no}</td><td><img src={publicPhotoUrl(household.photo_path)} alt="" className="h-12 w-12 rounded-lg object-cover" /></td><td><Link className="font-bold text-emerald-900 hover:underline" href={`/data/${household.id}`}>{household.head_name}</Link></td><td>{household.house_name}</td><td>{household.phone}</td><td>{memberCount(household)}</td><td className="whitespace-nowrap">{date(household.submitted_at)}</td><td><div className="flex gap-2"><Link href={`/data/${household.id}/edit`} className="secondary-button min-h-9 px-2 py-1 text-xs">തിരുത്തുക</Link><DeleteButton id={household.id} compact /></div></td></tr>)}</tbody></table></div>
    </>}
    {pages > 1 && <nav className="mt-6 flex items-center justify-center gap-3" aria-label="പേജുകൾ">{filters.page > 1 && <Link className="secondary-button" href={urlFor(filterValues, { page: filters.page - 1 })}>മുമ്പത്തെ</Link>}<span>പേജ് {filters.page} / {pages}</span>{filters.page < pages && <Link className="secondary-button" href={urlFor(filterValues, { page: filters.page + 1 })}>അടുത്തത്</Link>}</nav>}
  </main>;
}

function FilterForm({ filters }: { filters: ReturnType<typeof filterSchema.parse> }) {
  return <form method="get" className="mt-4 grid gap-4 md:mt-0 md:grid-cols-4">
    <div className="md:col-span-2"><label className="field-label" htmlFor="q">തിരയുക</label><input id="q" name="q" defaultValue={filters.q} placeholder="പേര് / വീട്ടുപേര് / ഫോൺ തിരയുക" /></div>
    <div><label className="field-label" htmlFor="house_type">വീടിന്റെ സ്ഥിതി</label><select id="house_type" name="house_type" defaultValue={filters.house_type ?? ''}><option value="">എല്ലാം</option>{Object.entries(houseTypeLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
    <div><label className="field-label" htmlFor="illness">നിത്യരോഗികൾ</label><select id="illness" name="illness" defaultValue={filters.illness ?? ''}><option value="">എല്ലാം</option><option value="yes">ഉണ്ട്</option><option value="no">ഇല്ല</option></select></div>
    <div><label className="field-label" htmlFor="aid">സഹായം ലഭിക്കുന്നു</label><select id="aid" name="aid" defaultValue={filters.aid ?? ''}><option value="">എല്ലാം</option><option value="yes">ഉണ്ട്</option><option value="no">ഇല്ല</option></select></div>
    <div><label className="field-label" htmlFor="blood">ബ്ലഡ് ഗ്രൂപ്പ്</label><select id="blood" name="blood" defaultValue={filters.blood ?? ''}><option value="">എല്ലാം</option>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select></div>
    <div><label className="field-label" htmlFor="from">തീയതി മുതൽ</label><input id="from" name="from" type="date" defaultValue={filters.from ?? ''} /></div>
    <div><label className="field-label" htmlFor="to">തീയതി വരെ</label><input id="to" name="to" type="date" defaultValue={filters.to ?? ''} /></div>
    <div><label className="field-label" htmlFor="sort">ക്രമീകരണം</label><select id="sort" name="sort" defaultValue={filters.sort}><option value="new">പുതിയത് ആദ്യം</option><option value="old">പഴയത് ആദ്യം</option><option value="name">പേര് A–Z</option></select></div>
    <div className="flex items-end gap-2 md:col-span-3"><button className="primary-button" type="submit">പ്രയോഗിക്കുക</button><Link href="/data" className="secondary-button">മായ്ക്കുക</Link></div>
  </form>;
}
