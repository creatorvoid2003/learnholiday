# Supabase project files

This folder keeps the core schema reference and the SQL migration history for LearnHoliday.

## Files

- `bootstrap.sql` — core profiles, courses, learning resources and general progress schema. This is a reference for the original core setup, not a complete database export.
- `config.toml` — Supabase CLI project configuration.
- `migrations/` — the nine SQL migrations recovered from the connected project's migration ledger, including the latest security and foreign-key-index update.

## Feature tables in the connected database

- Core: `profiles`, `courses`, `learning_resources`, `user_progress`
- Lessons: `course_lessons`, `lesson_progress`
- Quizzes: `lesson_quiz_questions`, `lesson_quiz_attempts`
- Practice work: `lesson_practice_submissions`
- Learning goals: `learner_learning_goals`
- Classrooms: `learning_classes`, `learning_class_memberships`, `learning_class_invites`

All public tables currently have Row Level Security enabled. The migration files preserve the SQL statements recorded by the live project's migration history; they are not a newly invented schema.

## Important setup notes

1. The original core schema was applied before the tracked feature migrations and is not itself present in the remote migration ledger. `bootstrap.sql` documents that core setup.
2. The quiz migration contains seed inserts that reference lesson UUIDs. Those lesson records were created separately and are not present in the database now. A clean rebuild therefore still needs the matching lesson-content seed data before the quiz migration can be replayed. Do not assume the migrations alone are a complete one-command rebuild.
3. Do not run `bootstrap.sql` against the existing live project.
4. Do not use `supabase db reset` on the live project.
5. Before using `supabase db push`, link the project and compare local and remote migration histories. The initial core schema is not tracked as a remote migration, so reconcile that baseline first.
6. Never put a Supabase service-role or secret key in browser code. The publishable key in `assets/js/supabase-config.js` is intended for public clients; Row Level Security must protect the data.
7. The signup profile trigger and automatic RLS event-trigger function are not client RPCs; browser execution has been revoked. `join_learning_class` remains callable by authenticated users because it validates the learner and enforces class capacity inside the function.
8. Supabase leaked-password protection is still disabled in Auth settings. Enable it in the Supabase Dashboard under **Authentication → Settings → Password Security**.

## Safe CLI workflow

From the repository root:

```bash
supabase link --project-ref qczzvfsofyemhzafbxfm
supabase migration list
```

Review the local and remote histories before any push. Do not reset the live database or run the bootstrap file on it.
