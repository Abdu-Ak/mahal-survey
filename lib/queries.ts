import 'server-only';
import type { Filters } from './schema';
import { getSupabase } from './supabase';
import type { Household, Member } from './types';

const PAGE_SIZE = 25;

function searchPattern(value: string) {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[%_]/g, (match) => `\\${match}`);
  return `"%${escaped}%"`;
}

async function matchingMemberIds(filters: Filters) {
  const supabase = getSupabase();
  let qIds: string[] | null = null;
  let bloodIds: string[] | null = null;
  if (filters.q) {
    const pattern = searchPattern(filters.q);
    const { data, error } = await supabase.from('members').select('household_id').or(`name.ilike.${pattern},phone.ilike.${pattern}`).limit(10000);
    if (error) throw error;
    qIds = [...new Set((data ?? []).map((row) => row.household_id as string))];
  }
  if (filters.blood) {
    const { data, error } = await supabase.from('members').select('household_id').eq('blood_group', filters.blood).limit(10000);
    if (error) throw error;
    bloodIds = [...new Set((data ?? []).map((row) => row.household_id as string))];
  }
  return { qIds, bloodIds };
}

export async function queryHouseholds(filters: Filters, paged = true) {
  const supabase = getSupabase();
  const { qIds, bloodIds } = await matchingMemberIds(filters);
  const { count: total } = await supabase.from('households').select('id', { count: 'exact', head: true });
  if (bloodIds && bloodIds.length === 0) return { households: [] as Household[], filteredCount: 0, totalCount: total ?? 0, pageSize: PAGE_SIZE };

  let query = supabase.from('households').select('*, members(count)', { count: 'exact' });
  if (filters.q) {
    const pattern = searchPattern(filters.q);
    const memberClause = qIds?.length ? `,id.in.(${qIds.join(',')})` : '';
    query = query.or(`head_name.ilike.${pattern},house_name.ilike.${pattern},phone.ilike.${pattern}${memberClause}`);
  }
  if (bloodIds) query = query.in('id', bloodIds);
  if (filters.house_type) query = query.eq('house_type', filters.house_type);
  if (filters.illness) query = query.eq('has_chronic_illness', filters.illness === 'yes');
  if (filters.aid) query = query.eq('receives_aid', filters.aid === 'yes');
  if (filters.from) query = query.gte('submitted_at', `${filters.from}T00:00:00+05:30`);
  if (filters.to) query = query.lte('submitted_at', `${filters.to}T23:59:59.999+05:30`);
  if (filters.sort === 'old') query = query.order('submitted_at', { ascending: true });
  else if (filters.sort === 'name') query = query.order('head_name', { ascending: true });
  else query = query.order('submitted_at', { ascending: false });
  if (paged) {
    const start = (filters.page - 1) * PAGE_SIZE;
    query = query.range(start, start + PAGE_SIZE - 1);
  }
  const { data, error, count } = await query;
  if (error) throw error;
  return { households: (data ?? []) as unknown as Household[], filteredCount: count ?? 0, totalCount: total ?? 0, pageSize: PAGE_SIZE };
}

export async function getHousehold(id: string) {
  const { data, error } = await getSupabase().from('households').select('*, members(*)').eq('id', id).order('sl_no', { referencedTable: 'members', ascending: true }).maybeSingle();
  if (error) throw error;
  return data as unknown as (Household & { members: Member[] }) | null;
}
