import { RegistrationForm } from '@/components/RegistrationForm';
import { SiteHeader } from '@/components/SiteHeader';
import { labels } from '@/lib/labels';

export default function RegistrationPage() {
  return (
    <>
      <SiteHeader />
      <main className="form-shell py-7 md:py-10">
        <div className="mb-6 text-center">
          <p className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900">കുടുംബ വിവരശേഖരണം</p>
          <h1 className="text-2xl font-bold text-emerald-950 md:text-3xl">{labels.appTitle}</h1>
          <p className="mt-2 text-slate-600">നക്ഷത്ര ചിഹ്നമുള്ള വിവരങ്ങൾ നിർബന്ധമാണ്.</p>
        </div>
        <RegistrationForm />
      </main>
    </>
  );
}
