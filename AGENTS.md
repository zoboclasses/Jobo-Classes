# AGENTS.md - AI Assistant Guide for Jobo Classes

Read this before making any changes. It explains how the platform works end to end.

## What this project is
Jobo Classes is a multi-page e-learning platform for Indian government exam preparation (like Testbook/Unacademy). Courses contain **videos**, **mock tests**, and **notes**. It uses a **freemium model**: items marked `is_free = true` are open to everyone; everything else unlocks only after the user pays for the course via Razorpay.

## Tech stack
- **Next.js 14 (App Router, JavaScript, no TypeScript)** - `src/app/` pages, `src/components/` shared UI
- **Tailwind CSS** - utility classes + custom classes in `src/app/globals.css` (`.btn-primary`, `.btn-ghost`, `.card`, `.input`, `.tag`, `.container-x`)
- **Framer Motion** - `Reveal` (fade-up) and `TextReveal` (word-by-word) in `src/components/Reveal.jsx`; wrap new sections in these for scroll animations
- **Lenis** - smooth scrolling, mounted once in `src/components/SmoothScroll.jsx` via root layout
- **Supabase** - Postgres DB, Auth (email/password, Google OAuth) and RLS
- **Razorpay** - payments

## Design rules
Minimalist aesthetic: white/near-white background (`paper`), near-black text (`ink`), blue accent (`accent` #2563eb), rounded-2xl cards, generous whitespace. Every new page section should use `Reveal`/`TextReveal` for scroll animations. Mobile responsive always.

Navigation uses `assets/logo-1.png` beside the `JoboClasses` wordmark. The navbar should stay clean on mobile: logo/name, Courses, Dashboard/Login only. Do not put Sign out in the navbar; logout belongs inside the dashboard page as a centered dashboard action.

## Data model (supabase/migrations/0001_init.sql)
- `profiles` - 1:1 with auth.users (auto-created by `handle_new_user` trigger). `role` is 'student' or 'admin'
- `courses` - title, description, price_inr, is_published
- `videos` / `notes` / `mock_tests` - course content METADATA only (title, position, is_free). Public can read metadata of published courses so listings show locked items
- `video_sources` / `note_files` - the ACTUAL URLs, in separate tables readable ONLY by admins via RLS
- `questions` - belongs to mock_tests, contains `correct_index` (the answer). Admin-only via RLS
- `payments` - Razorpay order tracking (created/paid/failed)
- `enrollments` - unique (user_id, course_id); existence = user has paid = full course access
- `test_attempts` - score history shown on dashboard

## CRITICAL: content protection pattern
Never expose locked content to the browser. The pattern used everywhere:
1. Page (server component) fetches metadata with the anon/session client (`src/lib/supabase/server.js`)
2. Access check via `checkAccess()` in `src/lib/access.js`: allowed if `is_free` OR user enrolled OR user is admin
3. ONLY if allowed, fetch the protected payload (video URL, note URL, questions) with the service-role client (`src/lib/supabase/admin.js` - server-only, never import in client components)
4. Questions are sent to the client WITHOUT `correct_index`; scoring happens server-side in `/api/tests/submit`

When adding any new content type, follow this same split: public metadata table + admin-only payload table + server-side access check.

## Key flows
- **Auth**: `src/app/login/page.jsx` (email/password + Google button). OAuth/email-confirm redirects go through `src/app/auth/callback/route.js`. Session refresh in `middleware.js`
- **Logout**: handled from the dashboard page with `src/components/DashboardSignOut.jsx`; keep the navbar free of logout buttons.
- **Payment**: checkout page -> POST `/api/razorpay/order` (creates Razorpay order + `payments` row) -> Razorpay modal -> POST `/api/razorpay/verify` (HMAC SHA256 signature check with RAZORPAY_KEY_SECRET, then mark paid + upsert `enrollments`). Never trust the client about payment success
- **Mock test**: `/tests/[testId]` server page checks access, strips answers, renders `TestRunner.jsx` (timer auto-submits at 0, question palette, negative marking). Submit -> `/api/tests/submit` re-verifies access, scores, inserts `test_attempts`, returns `correctMap` for the review screen
- **Admin**: `/admin` (course CRUD, publish toggle) and `/admin/courses/[id]` (videos/notes/tests/questions CRUD, free-sample toggles). Client-side pages guarded by profile role check; RLS `is_admin()` policies are the real enforcement

## Environment variables (.env.example)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only!), `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (server-only!), `NEXT_PUBLIC_SITE_URL`.
Never commit real values. Never use service role key or Razorpay secret in client components.

## Conventions
- JavaScript only, 2-space indent, single quotes
- Server components by default; `'use client'` only when state/effects/browser APIs needed
- Use `@/` import alias for `src/`
- DB changes = new numbered file in `supabase/migrations/` (never edit 0001 after it has been run in production)
- Currency is INR; Razorpay amounts are in paise (price_inr * 100)
- All access control must exist server-side (RLS or API route); UI lock states are cosmetic only

## Workflow for changes
1. Branch from `main`, commit, open a merge request (MRs reference issues, e.g. `Closes #1`)
2. If schema changes: add migration SQL + update seed if needed + keep RLS policies in sync
3. Test the freemium boundary after any change: logged-out user, logged-in non-enrolled user, enrolled user, admin
4. Update this file and README.md when architecture or workflows change
