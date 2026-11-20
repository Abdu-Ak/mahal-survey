import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ no?: string }> }) {
  const { no } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="form-shell flex min-h-[60vh] items-center justify-center py-10">
        <section className="section-card w-full text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-800">✓</div>
          <h1 className="mt-5 text-2xl font-bold text-emerald-950">രജിസ്ട്രേഷൻ വിജയകരമായി പൂർത്തിയായി</h1>
          {no && <p className="mt-3 text-lg">രജിസ്ട്രേഷൻ നമ്പർ: <strong>{no}</strong></p>}
          <Link href="/" className="secondary-button mt-6">പുതിയ രജിസ്ട്രേഷൻ</Link>
        </section>
      </main>
    </>
  );
}
