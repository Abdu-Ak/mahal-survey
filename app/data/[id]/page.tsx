import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';
import { DeleteButton } from '@/components/DeleteButton';
import { PrintButton } from '@/components/PrintButton';
import { houseTypeLabels } from '@/lib/config';
import { isAdmin } from '@/lib/admin-auth';
import { getHousehold } from '@/lib/queries';
import { publicPhotoUrl } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdmin())) redirect(`/admin-login?next=/data/${id}`);
  const household = await getHousehold(id);
  if (!household) notFound();
  const dateTime = (value: string) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const yesNo = (value: boolean) => value ? 'ഉണ്ട്' : 'ഇല്ല';
  const details = [
    ['രജിസ്ട്രേഷൻ നമ്പർ', household.serial_no], ['കുടുംബനാഥന്റെ പേര്', household.head_name], ['വീട്ടുപേര്', household.house_name],
    ['വയസ്സ്', household.head_age], ['ഫോൺ നമ്പർ', household.phone], ['വീടിന്റെ നിലവിലെ സ്ഥിതി', houseTypeLabels[household.house_type]],
    ['നിത്യരോഗികളുണ്ടോ?', yesNo(household.has_chronic_illness)], ['രോഗ വിവരം', household.chronic_details || '—'],
    ['സഹായം ലഭിക്കുന്നുണ്ടോ?', yesNo(household.receives_aid)], ['സഹായ വിവരം', household.aid_details || '—'],
  ];
  return <main className="page-shell py-7 md:py-10">
    <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3"><Link className="secondary-button icon-button" href="/data" aria-label="തിരികെ" title="തിരികെ"><ArrowLeft aria-hidden="true" size={19} /></Link><div className="flex flex-wrap gap-2"><PrintButton /><Link className="secondary-button icon-button" href={`/data/${id}/edit`} aria-label="തിരുത്തുക" title="തിരുത്തുക"><Pencil aria-hidden="true" size={19} /></Link><DeleteButton id={id} /></div></div>
    <article className="space-y-5">
      <section className="section-card grid gap-6 md:grid-cols-[18rem_1fr]">
        <img src={publicPhotoUrl(household.photo_path)} alt={`${household.head_name} ഫോട്ടോ`} className="aspect-[4/3] w-full rounded-xl bg-slate-100 object-cover md:aspect-[3/4]" />
        <div><p className="text-sm font-medium text-emerald-700">കുടുംബ വിവരങ്ങൾ</p><h1 className="text-2xl font-bold text-emerald-950 md:text-3xl">{household.head_name}</h1><p className="mt-1 text-slate-600">{household.house_name}</p><dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{details.map(([term, value]) => <div key={String(term)}><dt className="text-sm text-slate-500">{term}</dt><dd className="font-medium">{value}</dd></div>)}</dl><div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600"><p>സമർപ്പിച്ചത്: {dateTime(household.submitted_at)}</p>{household.updated_at && <p>അവസാനം തിരുത്തിയത്: {dateTime(household.updated_at)}</p>}</div></div>
      </section>
      <section className="section-card"><div className="flex items-baseline justify-between"><h2 className="section-title">മറ്റ് കുടുംബാംഗങ്ങൾ</h2><span className="text-sm text-slate-600">ആകെ: {household.members.length}</span></div>
        {household.members.length === 0 ? <p className="mt-4 text-slate-600">മറ്റ് അംഗങ്ങളില്ല</p> : <>
          <div className="mt-4 space-y-3 md:hidden">{household.members.map((member) => <div key={member.id} className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-emerald-700">അംഗം {member.sl_no}</p><h3 className="font-bold">{member.name}</h3><div className="mt-2 grid grid-cols-2 gap-2 text-sm"><p><span className="text-slate-500">വയസ്സ്:</span> {member.age ?? '—'}</p><p><span className="text-slate-500">ബന്ധം:</span> {member.relation || '—'}</p><p><span className="text-slate-500">വിദ്യാഭ്യാസം:</span> {member.education || '—'}</p><p><span className="text-slate-500">തൊഴിൽ:</span> {member.occupation || '—'}</p><p><span className="text-slate-500">ബ്ലഡ്:</span> {member.blood_group || '—'}</p><p><span className="text-slate-500">ഫോൺ:</span> {member.phone || '—'}</p></div></div>)}</div>
          <div className="mt-4 hidden overflow-x-auto md:block"><table className="data-table"><thead><tr><th>നമ്പർ</th><th>പേര്</th><th>വയസ്സ്</th><th>ബന്ധം</th><th>വിദ്യാഭ്യാസം</th><th>ടെക്നിക്കൽ</th><th>തൊഴിൽ</th><th>ബ്ലഡ്</th><th>ഫോൺ</th></tr></thead><tbody>{household.members.map((member) => <tr key={member.id}><td>{member.sl_no}</td><td className="font-medium">{member.name}</td><td>{member.age ?? '—'}</td><td>{member.relation || '—'}</td><td>{member.education || '—'}</td><td>{member.technical_qualification || '—'}</td><td>{member.occupation || '—'}</td><td>{member.blood_group || '—'}</td><td>{member.phone || '—'}</td></tr>)}</tbody></table></div>
        </>}
      </section>
    </article>
  </main>;
}
