import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { config, houseTypeLabels } from '@/lib/config';
import { queryHouseholds } from '@/lib/queries';
import { filterSchema } from '@/lib/schema';
import { getSupabase, publicPhotoUrl } from '@/lib/supabase';
import type { Member } from '@/lib/types';
import { labels } from '@/lib/labels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function indiaDate() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: config.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function styleSheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  const header = sheet.getRow(1);
  header.font = { bold: true, name: 'Noto Sans Malayalam', color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF155E4B' } };
  header.alignment = { vertical: 'middle' };
  sheet.eachRow((row) => { row.font = { ...row.font, name: 'Noto Sans Malayalam' }; });
  sheet.columns.forEach((column) => {
    let max = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => { max = Math.min(45, Math.max(max, String(cell.value ?? '').length + 2)); });
    column.width = max;
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'അനുവദനീയമല്ല' }, { status: 401 });
  try {
    const url = new URL(request.url);
    const filters = filterSchema.parse(Object.fromEntries(url.searchParams));
    const { households } = await queryHouseholds(filters, false);
    const ids = households.map((row) => row.id);
    let members: Member[] = [];
    if (ids.length) {
      const { data, error } = await getSupabase().from('members').select('*').in('household_id', ids).order('household_id').order('sl_no');
      if (error) throw error;
      members = (data ?? []) as Member[];
    }
    const memberMap = new Map<string, Member[]>();
    for (const member of members) memberMap.set(member.household_id, [...(memberMap.get(member.household_id) ?? []), member]);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = config.committeeName;
    workbook.created = new Date();
    const families = workbook.addWorksheet('കുടുംബങ്ങൾ');
    families.addRow(['നമ്പർ', 'തീയതി', 'കുടുംബനാഥന്റെ പേര്', 'വീട്ടുപേര്', 'വയസ്സ്', 'ഫോൺ', 'വീടിന്റെ സ്ഥിതി', 'നിത്യരോഗികൾ', 'രോഗ വിവരം', 'സഹായം', 'സഹായ വിവരം', 'ഫോട്ടോ ലിങ്ക്', 'അംഗങ്ങളുടെ എണ്ണം']);
    for (const row of households) families.addRow([row.serial_no, new Date(row.submitted_at), row.head_name, row.house_name, row.head_age, row.phone, houseTypeLabels[row.house_type], row.has_chronic_illness ? 'ഉണ്ട്' : 'ഇല്ല', row.chronic_details ?? '', row.receives_aid ? 'ഉണ്ട്' : 'ഇല്ല', row.aid_details ?? '', publicPhotoUrl(row.photo_path), memberMap.get(row.id)?.length ?? 0]);
    families.getColumn(2).numFmt = 'dd-mm-yyyy hh:mm';
    styleSheet(families);
    const memberSheet = workbook.addWorksheet('അംഗങ്ങൾ');
    memberSheet.addRow(['വീട് നമ്പർ', 'കുടുംബനാഥന്റെ പേര്', 'വീട്ടുപേര്', 'ക്രമ നമ്പർ', 'പേര്', 'വയസ്സ്', 'ബന്ധം', 'വിദ്യാഭ്യാസ യോഗ്യത', 'ടെക്നിക്കൽ യോഗ്യത', 'തൊഴിൽ', 'ബ്ലഡ് ഗ്രൂപ്പ്', 'ഫോൺ']);
    const byId = new Map(households.map((row) => [row.id, row]));
    for (const member of members) { const home = byId.get(member.household_id); if (home) memberSheet.addRow([home.serial_no, home.head_name, home.house_name, member.sl_no, member.name, member.age ?? '', member.relation ?? '', member.education ?? '', member.technical_qualification ?? '', member.occupation ?? '', member.blood_group ?? '', member.phone ?? '']); }
    styleSheet(memberSheet);
    const filterSheet = workbook.addWorksheet('ഫിൽട്ടർ');
    filterSheet.addRow(['ഫിൽട്ടർ', 'മൂല്യം']);
    const names: Record<string, string> = { q: 'തിരയുക', house_type: 'വീടിന്റെ സ്ഥിതി', illness: 'നിത്യരോഗികൾ', aid: 'സഹായം', blood: 'ബ്ലഡ് ഗ്രൂപ്പ്', from: 'തീയതി മുതൽ', to: 'തീയതി വരെ', sort: 'ക്രമീകരണം' };
    for (const [key, value] of Object.entries(filters)) if (key !== 'page' && value && !(key === 'sort' && value === 'new')) filterSheet.addRow([names[key] ?? key, String(value)]);
    filterSheet.addRow(['കുടുംബങ്ങളുടെ എണ്ണം', households.length]);
    filterSheet.addRow(['അംഗങ്ങളുടെ എണ്ണം', members.length]);
    filterSheet.addRow(['എക്സ്പോർട്ട് സമയം', new Intl.DateTimeFormat('en-IN', { timeZone: config.timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date())]);
    styleSheet(filterSheet);
    const buffer = await workbook.xlsx.writeBuffer();
    if (buffer.byteLength > 4.4 * 1024 * 1024) return NextResponse.json({ error: 'എക്സൽ ഫയൽ വളരെ വലുതാണ്. ഫിൽട്ടർ ഉപയോഗിച്ച് വീണ്ടും ശ്രമിക്കുക.' }, { status: 413 });
    const filtered = [...url.searchParams.keys()].some((key) => key !== 'page' && key !== 'sort');
    const filename = `mahall-registration-${indiaDate()}${filtered ? '-filtered' : ''}.xlsx`;
    return new Response(new Uint8Array(buffer), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Excel export failed', error);
    return NextResponse.json({ error: labels.genericError }, { status: 500 });
  }
}
