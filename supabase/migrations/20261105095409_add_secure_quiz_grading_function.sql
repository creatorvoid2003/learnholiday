
create or replace function public.grade_lesson_quiz(p_lesson_id uuid, p_answers integer[])
returns table(score integer, total_questions integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_score integer;
  v_total integer;
  v_answers jsonb;
begin
  if v_user_id is null then
    raise exception 'Please sign in to submit a quiz.';
  end if;

  select count(*)::integer,
         count(*) filter (
           where q.correct_option = p_answers[q.question_order]
         )::integer
    into v_total, v_score
  from public.lesson_quiz_questions q
  join public.course_lessons l on l.id = q.lesson_id
  where q.lesson_id = p_lesson_id
    and q.published = true
    and l.published = true;

  if v_total = 0 then
    raise exception 'No published quiz questions were found.';
  end if;

  if coalesce(array_length(p_answers, 1), 0) <> v_total then
    raise exception 'Please answer every question.';
  end if;

  select coalesce(jsonb_agg(to_jsonb(a) order by a.ordinality), '[]'::jsonb)
    into v_answers
  from unnest(p_answers) with ordinality as a(answer, ordinality);

  insert into public.lesson_quiz_attempts(user_id, lesson_id, score, total_questions, answers)
  values (v_user_id, p_lesson_id, v_score, v_total, v_answers);

  return query select v_score, v_total;
end;
$$;

revoke all on function public.grade_lesson_quiz(uuid, integer[]) from public, anon;
grant execute on function public.grade_lesson_quiz(uuid, integer[]) to authenticated;
