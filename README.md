# LearnHoliday

A lightweight multi-page learning website for learners and teachers.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`. The server health check is `/health`.

## Project structure

- `index.html`, `login.html`, `register.html`, `reset-password.html`: home and account pages.
- `courses.html`, `course.html`, `lesson.html`: course and lesson learning.
- `study-centre.html`: published study resources.
- `dashboard.html`: saved resources, lesson progress and learning goals.
- `classroom.html`: teacher classes and learner enrolment.
- `assets/css/style.css`: the single shared stylesheet, including the dark theme.
- `assets/js/supabase-config.js`: public Supabase project URL and publishable key.
- `assets/js/app.js`: shared browser behaviour for authentication, learning, quizzes, progress, classroom and theme.
- `server.js`: small static-file server and health endpoint.
- `supabase/bootstrap.sql`: core Supabase bootstrap reference.
- `supabase/README.md`: database structure, migration status and safety notes.

## Supabase setup

1. Keep the project URL and publishable key in `assets/js/supabase-config.js`. Never put a service-role or secret key in browser code.
2. The Supabase JavaScript library is loaded from jsDelivr by the HTML pages.
3. Configure the allowed authentication redirect URLs in Supabase for the deployed website and local development address.
4. The bootstrap SQL covers only core profiles, courses, resources and general progress. The connected database also contains lesson, quiz, practice, weekly-goal and classroom features. Their nine recorded migrations are now stored under `supabase/migrations/`; see `supabase/README.md` for baseline and replay limitations.
5. Do not rerun schema scripts against an existing project without reviewing them first. They can change database objects and policies.

## Maintenance notes

- Keep one stylesheet and one Supabase config file. The old root-level copies were removed because the pages already use the files under `assets/`.
- Keep page-specific behaviour guarded by the page's element IDs so the shared script can safely load on every page.
- Do not add duplicate event listeners or run the same page setup twice.
- Preserve existing database records when changing frontend code.
