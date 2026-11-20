alter table public.households
  add column if not exists address text not null default '',
  add column if not exists has_widow boolean not null default false;

create or replace function public.create_registration(p_household jsonb, p_members jsonb)
returns table (id uuid, serial_no bigint)
language plpgsql security definer set search_path = public
as $$
declare new_id uuid; new_serial bigint;
begin
  insert into households (head_name, house_name, address, head_age, phone, house_type, has_widow, has_chronic_illness, chronic_details, receives_aid, aid_details, photo_path)
  values (p_household->>'head_name', p_household->>'house_name', p_household->>'address', (p_household->>'head_age')::int, p_household->>'phone',
    p_household->>'house_type', (p_household->>'has_widow')::boolean, (p_household->>'has_chronic_illness')::boolean, p_household->>'chronic_details',
    (p_household->>'receives_aid')::boolean, p_household->>'aid_details', p_household->>'photo_path')
  returning households.id, households.serial_no into new_id, new_serial;
  insert into members (household_id, sl_no, name, age, relation, education, technical_qualification, occupation, blood_group, phone)
  select new_id, x.sl_no, x.name, x.age, x.relation, x.education, x.technical_qualification, x.occupation, x.blood_group, x.phone
  from jsonb_to_recordset(coalesce(p_members, '[]'::jsonb)) as x(sl_no int, name text, age int, relation text, education text, technical_qualification text, occupation text, blood_group text, phone text);
  return query select new_id, new_serial;
end $$;

create or replace function public.update_registration(p_id uuid, p_household jsonb, p_members jsonb)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update households set
    head_name = p_household->>'head_name', house_name = p_household->>'house_name', address = p_household->>'address', head_age = (p_household->>'head_age')::int,
    phone = p_household->>'phone', house_type = p_household->>'house_type', has_widow = (p_household->>'has_widow')::boolean, has_chronic_illness = (p_household->>'has_chronic_illness')::boolean,
    chronic_details = p_household->>'chronic_details', receives_aid = (p_household->>'receives_aid')::boolean,
    aid_details = p_household->>'aid_details', photo_path = coalesce(p_household->>'photo_path', photo_path), updated_at = now()
  where id = p_id;
  if not found then raise exception 'Household not found'; end if;
  delete from members where household_id = p_id;
  insert into members (household_id, sl_no, name, age, relation, education, technical_qualification, occupation, blood_group, phone)
  select p_id, x.sl_no, x.name, x.age, x.relation, x.education, x.technical_qualification, x.occupation, x.blood_group, x.phone
  from jsonb_to_recordset(coalesce(p_members, '[]'::jsonb)) as x(sl_no int, name text, age int, relation text, education text, technical_qualification text, occupation text, blood_group text, phone text);
end $$;

revoke all on function public.create_registration(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.update_registration(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_registration(jsonb, jsonb) to service_role;
grant execute on function public.update_registration(uuid, jsonb, jsonb) to service_role;
