import { notFound, redirect } from 'next/navigation';
import { RegistrationForm } from '@/components/RegistrationForm';
import { isAdmin } from '@/lib/admin-auth';
import { getHousehold } from '@/lib/queries';
import { publicPhotoUrl } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdmin())) redirect(`/admin-login?next=/data/${id}/edit`);
  const household = await getHousehold(id);
  if (!household) notFound();
  const initialValues = {
    headName: household.head_name,
    houseName: household.house_name,
    headAge: household.head_age,
    phone: household.phone,
    houseType: household.house_type,
    hasChronicIllness: household.has_chronic_illness ? 'yes' as const : 'no' as const,
    chronicDetails: household.chronic_details ?? '',
    receivesAid: household.receives_aid ? 'yes' as const : 'no' as const,
    aidDetails: household.aid_details ?? '',
    website: '',
    members: household.members.map((member) => ({
      name: member.name, age: member.age ?? '' as const, relation: member.relation ?? '', education: member.education ?? '',
      technicalQualification: member.technical_qualification ?? '', occupation: member.occupation ?? '', bloodGroup: member.blood_group ?? '', phone: member.phone ?? '',
    })),
  };
  return <main className="form-shell py-7 md:py-10"><div className="mb-6"><p className="text-sm font-medium text-emerald-700">രജിസ്ട്രേഷൻ നമ്പർ {household.serial_no}</p><h1 className="text-2xl font-bold text-emerald-950 md:text-3xl">കുടുംബ വിവരങ്ങൾ തിരുത്തുക</h1></div><RegistrationForm mode="edit" householdId={id} initialValues={initialValues} currentPhotoUrl={publicPhotoUrl(household.photo_path)} serialNo={household.serial_no} submittedAt={household.submitted_at} /></main>;
}
