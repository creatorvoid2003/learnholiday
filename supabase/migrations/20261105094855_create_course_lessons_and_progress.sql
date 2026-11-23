
create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  summary text,
  content text not null default '',
  lesson_order integer not null default 1,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, lesson_order)
);
alter table public.course_lessons enable row level security;
revoke all on table public.course_lessons from anon, authenticated;
grant select on table public.course_lessons to anon, authenticated;
drop policy if exists "Published lessons are readable" on public.course_lessons;
create policy "Published lessons are readable" on public.course_lessons
for select to anon, authenticated using (published = true);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
revoke all on table public.lesson_progress from anon, authenticated;
grant select, insert, update on table public.lesson_progress to authenticated;
drop policy if exists "Learners read own lesson progress" on public.lesson_progress;
create policy "Learners read own lesson progress" on public.lesson_progress
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Learners create own lesson progress" on public.lesson_progress;
create policy "Learners create own lesson progress" on public.lesson_progress
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Learners update own lesson progress" on public.lesson_progress;
create policy "Learners update own lesson progress" on public.lesson_progress
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
