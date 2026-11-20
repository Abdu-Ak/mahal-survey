import { RegistrationForm } from '@/components/RegistrationForm';
import { SiteHeader } from '@/components/SiteHeader';
import { labels } from '@/lib/labels';

export default function RegistrationPage() {
  return (
    <>
      <SiteHeader />
      <main className="form-shell registration-main">
        <div className="registration-intro text-center">
          <p className="registration-badge mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-900">കുടുംബ വിവരശേഖരണം</p>
          <h1 className="registration-title font-bold text-emerald-950">{labels.appTitle}</h1>
          <p className="registration-subtitle mt-2 text-slate-600">നക്ഷത്ര ചിഹ്നമുള്ള വിവരങ്ങൾ നിർബന്ധമാണ്.</p>
        </div>
        <RegistrationForm />
      </main>
    </>
  );
}
