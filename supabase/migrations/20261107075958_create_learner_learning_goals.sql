create table if not exists public.learner_learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekly_lesson_target integer not null default 3 check (weekly_lesson_target between 1 and 30),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint learner_learning_goals_user_unique unique (user_id)
);
alter table public.learner_learning_goals enable row level security;
drop policy if exists "Learners read own learning goal" on public.learner_learning_goals;
create policy "Learners read own learning goal" on public.learner_learning_goals for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Learners insert own learning goal" on public.learner_learning_goals;
create policy "Learners insert own learning goal" on public.learner_learning_goals for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Learners update own learning goal" on public.learner_learning_goals;
create policy "Learners update own learning goal" on public.learner_learning_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.learner_learning_goals to authenticated;