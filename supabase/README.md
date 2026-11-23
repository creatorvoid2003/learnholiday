# Supabase files

This folder contains the **core bootstrap reference**, not a complete export of the live database.

## Files

- `bootstrap.sql` — creates the core profiles, courses, learning resources and general progress tables for a fresh project.

## Live database features

The connected LearnHoliday project also has these feature tables:

- Lessons: `course_lessons`, `lesson_progress`
- Quizzes: `lesson_quiz_questions`, `lesson_quiz_attempts`
- Practice work: `lesson_practice_submissions`
- Learning goals: `learner_learning_goals`
- Classrooms: `learning_classes`, `learning_class_memberships`, `learning_class_invites`

The live project records eight migrations (through `tighten_classroom_data_api_grants`). Those migration SQL files are **not currently present in this Git repository**, so this folder is not yet a complete, reproducible database history.

## Important

- Do not run `bootstrap.sql` on the existing live project as a repair script.
- Do not use `supabase db reset` on the live project.
- Keep schema changes as versioned migrations. Create each new migration with `supabase migration new <descriptive_name>`.
- Never put a Supabase service-role or secret key in browser code. The publishable key in `assets/js/supabase-config.js` is intended for public clients; Row Level Security must protect the data.
- The signup profile trigger runs automatically. Its function execution is revoked from browser roles because it is not a client RPC.
- Before changing policies, triggers, functions, or grants, inspect the live definition and test the affected feature.
