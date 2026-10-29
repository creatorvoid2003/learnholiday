
-- =========================================================
-- LEARNHOLIDAY DATABASE SCHEMA
-- For a fresh Supabase project
-- =========================================================

create extension if not exists pgcrypto;

-- 1. STUDENT AND USER PROFILES

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  learning_level text not null default 'other'
    check (
      learning_level in (
        'primary',
        'lower-secondary',
        'upper-secondary',
        'other'
      )
    ),
  role text not null default 'student'
    check (
      role in ('student', 'teacher', 'parent', 'admin')
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. COURSES

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  subject text not null,
  learning_level text not null default 'other',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. STUDY RESOURCES

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  subject text not null,
  resource_type text not null default 'notes',
  content text not null default '',
  file_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. STUDENT PROGRESS AND SAVED RESOURCES

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  resource_id uuid references public.learning_resources(id) on delete cascade,
  is_saved boolean not null default false,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint user_progress_has_item
    check (course_id is not null or resource_id is not null),
  constraint user_progress_one_item
    check (not (course_id is not null and resource_id is not null))
);

create unique index if not exists user_progress_user_course_unique
  on public.user_progress(user_id, course_id)
  where course_id is not null;

create unique index if not exists user_progress_user_resource_unique
  on public.user_progress(user_id, resource_id)
  where resource_id is not null;

create index if not exists courses_subject_idx
  on public.courses(subject);

create index if not exists resources_subject_idx
  on public.learning_resources(subject);

create index if not exists user_progress_user_idx
  on public.user_progress(user_id);

-- 5. AUTOMATIC UPDATED_AT TIMESTAMPS

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists resources_updated_at on public.learning_resources;
create trigger resources_updated_at
before update on public.learning_resources
for each row execute function public.set_updated_at();

drop trigger if exists progress_updated_at on public.user_progress;
create trigger progress_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

-- 6. CREATE A STUDENT PROFILE AFTER SIGN-UP

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    learning_level,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'learning_level'
        in ('primary', 'lower-secondary', 'upper-secondary', 'other')
      then new.raw_user_meta_data ->> 'learning_level'
      else 'other'
    end,
    'student'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 7. PREVENT USERS FROM CHANGING THEIR OWN ROLE

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Profile roles can only be changed by an authorised administrator.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

-- 8. ENABLE ROW LEVEL SECURITY

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.learning_resources enable row level security;
alter table public.user_progress enable row level security;

-- 9. REMOVE POLICIES IF THIS SCRIPT IS RUN AGAIN

drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Read published courses" on public.courses;
drop policy if exists "Read published resources" on public.learning_resources;
drop policy if exists "Read own progress" on public.user_progress;
drop policy if exists "Insert own progress" on public.user_progress;
drop policy if exists "Update own progress" on public.user_progress;
drop policy if exists "Delete own progress" on public.user_progress;

-- 10. PROFILE ACCESS

create policy "Read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Prevent clients from changing role or id through column updates.
revoke update on public.profiles from authenticated;
grant update (full_name, learning_level)
on public.profiles to authenticated;

-- 11. PUBLICLY READABLE PUBLISHED CONTENT

create policy "Read published courses"
on public.courses
for select
to anon, authenticated
using (published = true);

create policy "Read published resources"
on public.learning_resources
for select
to anon, authenticated
using (published = true);

-- 12. EACH USER CAN ACCESS ONLY THEIR OWN PROGRESS

create policy "Read own progress"
on public.user_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Insert own progress"
on public.user_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Update own progress"
on public.user_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Delete own progress"
on public.user_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- 13. TABLE PRIVILEGES

grant select on public.courses to anon, authenticated;
grant select on public.learning_resources to anon, authenticated;

grant select on public.profiles to authenticated;
grant select, insert, update, delete
on public.user_progress to authenticated;

-- 14. SAMPLE COURSES

insert into public.courses
  (title, description, subject, learning_level, published)
values
  (
    'Mathematics Essentials',
    'Introduction to numbers, fractions, algebra and problem-solving.',
    'mathematics',
    'other',
    true
  ),
  (
    'Science Fundamentals',
    'Explore scientific ideas, observation and investigation.',
    'science',
    'other',
    true
  ),
  (
    'English Language',
    'Develop grammar, reading, vocabulary and writing skills.',
    'english',
    'other',
    true
  ),
  (
    'Introduction to ICT',
    'Learn computer basics, software and digital productivity.',
    'ict',
    'other',
    true
  )
on conflict do nothing;

-- 15. SAMPLE LEARNING RESOURCES

insert into public.learning_resources
  (title, description, subject, resource_type, content, published)
values
  (
    'Introduction to Algebra',
    'Review variables, expressions and simple equations.',
    'mathematics',
    'notes',
    'Sample resource: add your reviewed algebra notes here.',
    true
  ),
  (
    'Scientific Investigation',
    'Explore observations, questions, experiments and conclusions.',
    'science',
    'revision',
    'Sample resource: add your reviewed science notes here.',
    true
  ),
  (
    'Grammar and Sentence Structure',
    'Review sentence construction and grammar concepts.',
    'english',
    'notes',
    'Sample resource: add your reviewed English notes here.',
    true
  ),
  (
    'Computer Basics',
    'Learn about hardware, software and file management.',
    'ict',
    'guide',
    'Sample resource: add your reviewed ICT notes here.',
    true
  )
on conflict do nothing;
