import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { householdPayload, membersPayload } from '@/lib/database-payload';
import { validatePhoto } from '@/lib/photo';
import { registrationSchema } from '@/lib/schema';
import { getSupabase } from '@/lib/supabase';
import { labels } from '@/lib/labels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let uploadedPath = '';
  try {
    const form = await request.formData();
    const raw = form.get('payload');
    if (typeof raw !== 'string') return NextResponse.json({ error: 'സമർപ്പിച്ച വിവരങ്ങൾ ശരിയല്ല' }, { status: 400 });
    const parsedJson: unknown = JSON.parse(raw);
    if (parsedJson && typeof parsedJson === 'object' && 'website' in parsedJson && parsedJson.website) {
      return NextResponse.json({ error: 'സമർപ്പിച്ച വിവരങ്ങൾ ശരിയല്ല. പേജ് പുതുക്കി വീണ്ടും ശ്രമിക്കുക.' }, { status: 400 });
    }
    const result = registrationSchema.safeParse(parsedJson);
    if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? 'സമർപ്പിച്ച വിവരങ്ങൾ ശരിയല്ല' }, { status: 400 });
    const validatedPhoto = await validatePhoto(form.get('photo') as File | null, true);
    if (!validatedPhoto) throw new Error('ഫോട്ടോ ചേർക്കുക');

    const supabase = getSupabase();
    uploadedPath = `${randomUUID()}.${validatedPhoto.extension}`;
    const { error: uploadError } = await supabase.storage.from('owner-photos').upload(uploadedPath, validatedPhoto.bytes, {
      contentType: validatedPhoto.contentType,
      upsert: false,
      cacheControl: '31536000',
    });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase.rpc('create_registration', {
      p_household: householdPayload(result.data, uploadedPath),
      p_members: membersPayload(result.data),
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, serialNo: row?.serial_no });
  } catch (error) {
    if (uploadedPath) await getSupabase().storage.from('owner-photos').remove([uploadedPath]);
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: /[ഀ-ൿ]/.test(message) ? message : labels.genericError }, { status: 500 });
  }
}
