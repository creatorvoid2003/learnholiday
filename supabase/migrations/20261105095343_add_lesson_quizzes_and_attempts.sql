
create table if not exists public.lesson_quiz_questions (
 id uuid primary key default gen_random_uuid(),
 lesson_id uuid not null references public.course_lessons(id) on delete cascade,
 question text not null,
 options jsonb not null,
 correct_option integer not null check (correct_option >= 0),
 explanation text,
 question_order integer not null default 1,
 published boolean not null default true,
 created_at timestamptz not null default now(),
 constraint lesson_quiz_options_array check (jsonb_typeof(options) = 'array'),
 constraint lesson_quiz_correct_option_valid check (correct_option < jsonb_array_length(options))
);
create index if not exists lesson_quiz_questions_lesson_idx on public.lesson_quiz_questions(lesson_id, question_order);
alter table public.lesson_quiz_questions enable row level security;
drop policy if exists "Published quiz questions are readable" on public.lesson_quiz_questions;
create policy "Published quiz questions are readable" on public.lesson_quiz_questions for select to anon, authenticated using (
 published = true and exists (select 1 from public.course_lessons l where l.id = lesson_id and l.published = true)
);
grant select on public.lesson_quiz_questions to anon, authenticated;

create table if not exists public.lesson_quiz_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 lesson_id uuid not null references public.course_lessons(id) on delete cascade,
 score integer not null check (score >= 0),
 total_questions integer not null check (total_questions > 0),
 answers jsonb not null default '[]'::jsonb,
 submitted_at timestamptz not null default now()
);
create index if not exists lesson_quiz_attempts_user_idx on public.lesson_quiz_attempts(user_id, submitted_at desc);
alter table public.lesson_quiz_attempts enable row level security;
drop policy if exists "Learners read own quiz attempts" on public.lesson_quiz_attempts;
create policy "Learners read own quiz attempts" on public.lesson_quiz_attempts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Learners submit own quiz attempts" on public.lesson_quiz_attempts;
create policy "Learners submit own quiz attempts" on public.lesson_quiz_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
grant select, insert on public.lesson_quiz_attempts to authenticated;

insert into public.lesson_quiz_questions (lesson_id, question, options, correct_option, explanation, question_order)
values
('6075a2c3-76b0-43a9-b71e-8c4e1c5dc64b','Which fraction is equivalent to 1/2?','["2/4","1/3","3/5","2/3"]',0,'2/4 simplifies to 1/2.',1),
('dd4f966f-40b3-458b-8d5f-4941b7718b69','What is 25% of 200?','["25","40","50","75"]',2,'25% is one quarter; 200 ÷ 4 = 50.',1),
('25d63a81-4440-497b-9d33-e38b6db514d7','If x + 5 = 12, what is x?','["5","7","12","17"]',1,'Subtract 5 from both sides: x = 7.',1),
('8ea8ca15-a623-4c96-b95f-bb993490f244','Which HTML element is commonly used to connect JavaScript to a page?','["<script>","<style>","<title>","<footer>"]',0,'The script element loads or contains JavaScript.',1),
('5980839c-a393-4880-bc6f-9ed4ff54f247','Which keyword declares a block-scoped variable that can be reassigned?','["const","let","static","define"]',1,'Use let when the variable may be reassigned.',1),
('acf03cfb-4283-44bd-94f1-8693444395fa','Which JavaScript statement runs code only when a condition is true?','["for","if","return","break"]',1,'An if statement checks a condition before running its block.',1),
('e16e7d79-a11b-4811-a01f-ac46fda7017c','Which component is commonly called the brain of a computer?','["Monitor","Keyboard","CPU","Mouse"]',2,'The CPU processes instructions and coordinates operations.',1),
('c59e0529-8e51-4624-8b8e-abf4e185783b','Which of these is an operating system?','["Windows","HTML","Google Search","USB"]',0,'Windows is an operating system that manages computer resources.',1),
('c8e271c6-d676-414c-9a2b-d86a1af5ae94','What is the safest action when a message asks for your password through an unfamiliar link?','["Enter it quickly","Forward it to everyone","Ignore the link and verify the sender","Share it in a group"]',2,'Do not enter passwords through unexpected links; verify through a trusted channel.',1),
('4f4f7795-8fcb-41a6-9a19-2ee0fbcec98e','What is the main purpose of CSS?','["Store data","Style web pages","Create database tables","Send email"]',1,'CSS controls the presentation and layout of web pages.',1),
('d7846075-98b7-40e3-a2f5-098eac0076d2','Which CSS property changes the text colour?','["font-size","background","color","margin"]',2,'The color property sets the foreground text colour.',1),
('9d7decf0-9457-4ed9-8c5f-25187cb674e1','Which CSS technique is commonly used to adapt layouts to screen sizes?','["Media queries","SQL joins","HTML comments","File compression"]',0,'Media queries apply styles based on device or viewport conditions.',1),
('8b7f6919-8b8f-4717-a321-bb15c12104fd','What does HTML provide to a web page?','["Structure and meaning","Internet connection","Computer power","A database server"]',0,'HTML describes the structure and meaning of page content.',1),
('c744c47c-263a-4170-8945-f202b33fb98d','Which declaration identifies a standard HTML5 document?','["<html5>","<!DOCTYPE html>","<head>","<document>"]',1,'The doctype declaration tells the browser to use standards mode.',1),
('6e5f9fe5-9a19-41fe-be32-5855d59ffb71','Which HTML element creates a hyperlink?','["<img>","<a>","<p>","<h1>"]',1,'The anchor element creates links to other resources.',1)
on conflict do nothing;
