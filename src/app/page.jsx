import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Reveal, TextReveal } from '@/components/Reveal';
import CourseCard from '@/components/CourseCard';
import AnnouncementBar from '@/components/AnnouncementBar';

export const revalidate = 60;

function FeatureIcon({ type }) {
  const icons = {
    video: (
      <>
        <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h7A2.5 2.5 0 0 1 17 7.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 5 14.5v-7Z" />
        <path d="m17 9 4-2.5v9L17 13" />
        <path d="M9 9.5h4M9 12.5h2" />
      </>
    ),
    test: (
      <>
        <path d="M7 3h7l4 4v14H7V3Z" />
        <path d="M14 3v5h5" />
        <path d="m8.5 15 2 2 4.5-5" />
      </>
    ),
    notes: (
      <>
        <path d="M7 4h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
        <path d="M7 4v16" />
        <path d="M10 8h5M10 12h5" />
      </>
    )
  };

  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/15">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icons[type]}
      </svg>
    </span>
  );
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from('courses').select('*').eq('is_published', true)
    .order('created_at', { ascending: false }).limit(6);

  return (
    <div>
      <AnnouncementBar />

      {/* Hero */}
      <section className="container-x py-24 text-center sm:py-36">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          <TextReveal text="Crack your government exam," />
          <br />
          <TextReveal text="one lesson at a time." className="text-accent" />
        </h1>
        <Reveal delay={0.4}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/60">
            Video lectures, real exam-style mock tests and crisp notes. Try free demos in every course before you pay.
          </p>
        </Reveal>
        <Reveal delay={0.55}>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/courses" className="btn-primary">Browse Courses</Link>
            <Link href="/login" className="btn-ghost">Get Started Free</Link>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="container-x">
        <Reveal>
          <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-end">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Learn, test, revise</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight lg:text-4xl">
                <TextReveal text="Everything you need to keep moving." />
              </h2>
            </div>
            <p className="max-w-full text-sm leading-6 text-ink/60">
              Build momentum with guided lessons, realistic tests, and focused notes designed for government exam preparation.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            ['video', 'Video Lectures', 'Structured lessons by experts. First lessons free in every course.'],
            ['test', 'Mock Tests', 'Timed, exam-pattern tests with instant scoring and review.'],
            ['notes', 'Smart Notes', 'Concise revision notes. Free samples to try before buying.']
          ].map(([type, title, desc], i) => (
            <Reveal key={title} delay={i * 0.12}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-xl">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-accent/5 transition duration-300 group-hover:bg-accent/10" />
                <FeatureIcon type={type} />
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section className="container-x py-24">
        <h2 className="text-3xl font-bold tracking-tight">
          <TextReveal text="Popular courses" />
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(courses ?? []).map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
        </div>
      </section>
    </div>
  );
}
