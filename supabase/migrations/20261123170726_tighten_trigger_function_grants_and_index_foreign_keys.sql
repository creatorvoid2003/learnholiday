
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS user_progress_course_id_idx
  ON public.user_progress (course_id);
CREATE INDEX IF NOT EXISTS user_progress_resource_id_idx
  ON public.user_progress (resource_id);
CREATE INDEX IF NOT EXISTS lesson_progress_lesson_id_idx
  ON public.lesson_progress (lesson_id);
CREATE INDEX IF NOT EXISTS lesson_quiz_attempts_lesson_id_idx
  ON public.lesson_quiz_attempts (lesson_id);
CREATE INDEX IF NOT EXISTS lesson_practice_submissions_lesson_id_idx
  ON public.lesson_practice_submissions (lesson_id);
CREATE INDEX IF NOT EXISTS learning_class_invites_teacher_id_idx
  ON public.learning_class_invites (teacher_id);
