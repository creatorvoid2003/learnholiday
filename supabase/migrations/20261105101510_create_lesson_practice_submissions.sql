create table if not exists public.lesson_practice_submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    lesson_id uuid not null references public.course_lessons(id) on delete cascade,
    practice_data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    constraint lesson_practice_submissions_user_lesson_key unique (user_id, lesson_id)
  );

  alter table public.lesson_practice_submissions enable row level security;

  create policy "Learners can read their own practice work"
    on public.lesson_practice_submissions
    for select to authenticated
    using ((select auth.uid()) = user_id);

  create policy "Learners can create their own practice work"
    on public.lesson_practice_submissions
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

  create policy "Learners can update their own practice work"
    on public.lesson_practice_submissions
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

  grant select, insert, update on public.lesson_practice_submissions to authenticated;