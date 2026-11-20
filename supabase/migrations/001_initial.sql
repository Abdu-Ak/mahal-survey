create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  serial_no bigint generated always as identity unique,
  submitted_at timestamptz not null default now(),
  head_name text not null check (char_length(head_name) between 1 and 120),
  house_name text not null check (char_length(house_name) between 1 and 120),
  head_age int not null check (head_age between 10 and 120),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  house_type text not null check (house_type in ('sheet','ode','warp')),
  has_chronic_illness boolean not null,
  chronic_details text,
  receives_aid boolean not null,
  aid_details text,
  photo_path text not null,
  updated_at timestamptz,
  constraint chronic_details_required check (not has_chronic_illness or nullif(btrim(chronic_details), '') is not null),
  constraint aid_details_required check (not receives_aid or nullif(btrim(aid_details), '') is not null)
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  sl_no int not null check (sl_no between 1 and 10),
  name text not null check (char_length(name) between 1 and 120),
  age int check (age between 0 and 120),
  relation text,
  education text,
  technical_qualification text,
  occupation text,
  blood_group text check (blood_group is null or blood_group in ('A+','A−','B+','B−','O+','O−','AB+','AB−','അറിയില്ല')),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  unique (household_id, sl_no)
);

create index if not exists households_submitted_at_idx on public.households (submitted_at desc);
create index if not exists households_head_name_idx on public.households (head_name);
create index if not exists members_household_id_idx on public.members (household_id);
create index if not exists members_blood_group_idx on public.members (blood_group);

alter table public.households enable row level security;
alter table public.members enable row level security;

create or replace function public.create_registration(p_household jsonb, p_members jsonb)
returns table (id uuid, serial_no bigint)
language plpgsql security definer set search_path = public
as $$
declare new_id uuid; new_serial bigint;
begin
  insert into households (head_name, house_name, head_age, phone, house_type, has_chronic_illness, chronic_details, receives_aid, aid_details, photo_path)
  values (p_household->>'head_name', p_household->>'house_name', (p_household->>'head_age')::int, p_household->>'phone',
    p_household->>'house_type', (p_household->>'has_chronic_illness')::boolean, p_household->>'chronic_details',
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
    head_name = p_household->>'head_name', house_name = p_household->>'house_name', head_age = (p_household->>'head_age')::int,
    phone = p_household->>'phone', house_type = p_household->>'house_type', has_chronic_illness = (p_household->>'has_chronic_illness')::boolean,
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
