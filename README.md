# Jobo Classes

A minimalist, multi-page e-learning platform for government exam preparation. Video lectures, timed mock tests and notes with a freemium model: free demos in every course, full access after payment.

Built with **Next.js (App Router) + Tailwind CSS + Framer Motion + Lenis (smooth scroll) + Supabase + Razorpay**.

## Features
- Courses with videos, mock tests and notes
- Freemium: mark any video/test/note as a free sample; the rest unlock after payment (enforced server-side with RLS + service-role checks)
- Razorpay checkout with server-side order creation and signature verification
- Auth: email/password and Google OAuth (Supabase Auth)
- Interactive mock tests: timer, question palette, negative marking, instant scoring and answer review
- Admin panel: create/edit/delete courses, add videos/notes/tests/questions, toggle free samples, publish/unpublish
- Minimalist design with smooth scrolling and text-reveal-on-scroll animations

## Setup

### 1. Install
```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### 2. Supabase
1. Create a project at https://supabase.com
2. Run `supabase/migrations/0001_init.sql` in the SQL Editor, then optionally `supabase/seed.sql`
3. Copy Project URL + anon key + service role key into `.env.local`
4. Make yourself admin: `update public.profiles set role = 'admin' where id = '<your-user-uuid>';`

### 3. Google login
Supabase Dashboard > Authentication > Providers > Google: enable it and add OAuth credentials from Google Cloud Console. Set the redirect URL Supabase shows you in the Google console.

### 4. Razorpay
Create API keys at https://dashboard.razorpay.com and put the key id + secret in `.env.local`. Test mode keys work out of the box.

## Content protection
- Video URLs, note file URLs and question answers are **never** exposed to the browser for locked content
- RLS policies restrict those tables to admins; students receive content only through server components/API routes after an enrollment check
- For stronger video protection, host videos on Supabase Storage (signed URLs) or a DRM provider like VdoCipher/Mux instead of YouTube embeds

## Deploy to production (Vercel)
1. Push to GitLab, then import the repo at https://vercel.com/new (or connect via GitLab integration)
2. Add the environment variables from `.env.example` in Vercel > Project > Settings > Environment Variables (set `NEXT_PUBLIC_SITE_URL` to your live domain)
3. In Supabase > Authentication > URL Configuration, set Site URL to your live domain and add `https://yourdomain.com/auth/callback` to Redirect URLs
4. Switch Razorpay to live keys when going live

## Security notes
- Never commit `.env.local` or share the service role key / access tokens anywhere
- Security headers, robots.txt and sitemap are configured out of the box
- `/admin`, `/dashboard` and `/api` are blocked from search engines

## Admin workflow
1. Login, then open **Dashboard > Admin Panel**
2. Create a course, add videos (embed URLs), notes (PDF URLs), mock tests and questions
3. Mark 1-2 items as **Free sample** per section
4. **Publish** the course when ready
