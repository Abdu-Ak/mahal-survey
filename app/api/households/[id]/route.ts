import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAdmin, isSameOrigin } from '@/lib/admin-auth';
import { householdPayload, membersPayload } from '@/lib/database-payload';
import { validatePhoto } from '@/lib/photo';
import { registrationSchema } from '@/lib/schema';
import { getSupabase } from '@/lib/supabase';
import { labels } from '@/lib/labels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorized(request: Request) { return (await isAdmin()) && isSameOrigin(request); }

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized(request))) return NextResponse.json({ error: 'അനുവദനീയമല്ല' }, { status: 401 });
  const { id } = await params;
  let newPath = '';
  try {
    const supabase = getSupabase();
    const { data: current, error: readError } = await supabase.from('households').select('photo_path').eq('id', id).maybeSingle();
    if (readError) throw readError;
    if (!current) return NextResponse.json({ error: 'വിവരങ്ങൾ കണ്ടെത്താനായില്ല' }, { status: 404 });
    const form = await request.formData();
    const raw = form.get('payload');
    if (typeof raw !== 'string') return NextResponse.json({ error: 'സമർപ്പിച്ച വിവരങ്ങൾ ശരിയല്ല' }, { status: 400 });
    const parsed = registrationSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const photo = await validatePhoto(form.get('photo') as File | null, false);
    if (photo) {
      newPath = `${randomUUID()}.${photo.extension}`;
      const { error } = await supabase.storage.from('owner-photos').upload(newPath, photo.bytes, { contentType: photo.contentType, cacheControl: '31536000' });
      if (error) throw error;
    }
    const { error } = await supabase.rpc('update_registration', { p_id: id, p_household: householdPayload(parsed.data, newPath || undefined), p_members: membersPayload(parsed.data) });
    if (error) throw error;
    if (newPath && current.photo_path) await supabase.storage.from('owner-photos').remove([current.photo_path]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (newPath) await getSupabase().storage.from('owner-photos').remove([newPath]);
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: /[ഀ-ൿ]/.test(message) ? message : labels.genericError }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized(request))) return NextResponse.json({ error: 'അനുവദനീയമല്ല' }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabase();
  const { data, error: readError } = await supabase.from('households').select('photo_path').eq('id', id).maybeSingle();
  if (readError) return NextResponse.json({ error: labels.genericError }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'വിവരങ്ങൾ കണ്ടെത്താനായില്ല' }, { status: 404 });
  const { error } = await supabase.from('households').delete().eq('id', id);
  if (error) return NextResponse.json({ error: labels.genericError }, { status: 500 });
  if (data.photo_path) await supabase.storage.from('owner-photos').remove([data.photo_path]);
  return NextResponse.json({ ok: true });
}
