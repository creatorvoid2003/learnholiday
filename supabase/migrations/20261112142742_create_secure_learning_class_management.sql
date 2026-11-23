
-- Protect account roles: only trusted SQL/admin operations can change profiles.role.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and old.role is distinct from new.role then
    raise exception 'Account roles can only be changed by an administrator.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update of role on public.profiles
for each row execute function public.prevent_self_role_change();

create table if not exists public.learning_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 3 and 100),
  subject text not null check (char_length(btrim(subject)) between 2 and 60),
  description text not null default '' check (char_length(description) <= 1000),
  status text not null default 'active' check (status in ('active','archived')),
  max_learners integer not null default 50 check (max_learners = 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learning_classes_teacher_idx
  on public.learning_classes(teacher_id, created_at desc);

create table if not exists public.learning_class_memberships (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.learning_classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','removed')),
  joined_at timestamptz not null default now(),
  unique(class_id, learner_id)
);

create index if not exists learning_class_memberships_learner_idx
  on public.learning_class_memberships(learner_id, joined_at desc);
create index if not exists learning_class_memberships_teacher_idx
  on public.learning_class_memberships(teacher_id, class_id);

create table if not exists public.learning_class_invites (
  class_id uuid primary key references public.learning_classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.learning_classes enable row level security;
alter table public.learning_class_memberships enable row level security;
alter table public.learning_class_invites enable row level security;

drop policy if exists "Teachers create their own classes" on public.learning_classes;
create policy "Teachers create their own classes"
on public.learning_classes for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'teacher'
  )
);

drop policy if exists "Teachers and class learners read classes" on public.learning_classes;
create policy "Teachers and class learners read classes"
on public.learning_classes for select to authenticated
using (
  teacher_id = (select auth.uid())
  or id in (
    select m.class_id from public.learning_class_memberships m
    where m.learner_id = (select auth.uid()) and m.status = 'active'
  )
);

drop policy if exists "Teachers update their own classes" on public.learning_classes;
create policy "Teachers update their own classes"
on public.learning_classes for update to authenticated
using (
  teacher_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'teacher')
)
with check (
  teacher_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'teacher')
);

drop policy if exists "Teachers delete their own classes" on public.learning_classes;
create policy "Teachers delete their own classes"
on public.learning_classes for delete to authenticated
using (
  teacher_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'teacher')
);

drop policy if exists "Learners and class teachers read memberships" on public.learning_class_memberships;
create policy "Learners and class teachers read memberships"
on public.learning_class_memberships for select to authenticated
using (learner_id = (select auth.uid()) or teacher_id = (select auth.uid()));

drop policy if exists "Teachers read their own invite codes" on public.learning_class_invites;
create policy "Teachers read their own invite codes"
on public.learning_class_invites for select to authenticated
using (
  teacher_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'teacher')
);

create or replace function public.create_learning_class_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.learning_class_invites(class_id, teacher_id)
  values (new.id, new.teacher_id);
  return new;
end;
$$;

revoke all on function public.create_learning_class_invite() from public, anon, authenticated;
drop trigger if exists create_learning_class_invite_after_insert on public.learning_classes;
create trigger create_learning_class_invite_after_insert
after insert on public.learning_classes
for each row execute function public.create_learning_class_invite();

create or replace function public.join_learning_class(p_join_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_class_id uuid;
  v_teacher_id uuid;
  v_status text;
  v_capacity integer;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Please sign in before joining a class.';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_user_id and p.role = 'student'
  ) then
    raise exception 'Only learner accounts can join a class.';
  end if;

  select i.class_id
    into v_class_id
  from public.learning_class_invites i
  where i.join_code = upper(pg_catalog.btrim(coalesce(p_join_code, '')))
    and i.is_active = true;

  if v_class_id is null then
    raise exception 'That class code is invalid or inactive.';
  end if;

  select c.teacher_id, c.status, c.max_learners
    into v_teacher_id, v_status, v_capacity
  from public.learning_classes c
  where c.id = v_class_id
  for update;

  if v_status is distinct from 'active' then
    raise exception 'This class is not currently accepting learners.';
  end if;

  if exists (
    select 1 from public.learning_class_memberships m
    where m.class_id = v_class_id and m.learner_id = v_user_id and m.status = 'active'
  ) then
    return v_class_id;
  end if;

  select count(*)::integer into v_count
  from public.learning_class_memberships m
  where m.class_id = v_class_id and m.status = 'active';

  if v_count >= v_capacity then
    raise exception 'This class has reached its 50-learner limit.';
  end if;

  insert into public.learning_class_memberships(class_id, teacher_id, learner_id)
  values (v_class_id, v_teacher_id, v_user_id)
  on conflict (class_id, learner_id)
  do update set status = 'active', joined_at = now();

  return v_class_id;
end;
$$;

revoke all on function public.join_learning_class(text) from public, anon;
grant execute on function public.join_learning_class(text) to authenticated;

grant select, insert, update, delete on public.learning_classes to authenticated;
grant select on public.learning_class_memberships to authenticated;
grant select on public.learning_class_invites to authenticated;
