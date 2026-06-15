import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Reveal, TextReveal } from '@/components/Reveal';

function IconBadge({ type }) {
  const icons = {
    video: (
      <>
        <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h7A2.5 2.5 0 0 1 17 7.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 5 14.5v-7Z" />
        <path d="m17 9 4-2.5v9L17 13" />
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
      </>
    ),
    lock: (
      <>
        <rect x="6" y="10" width="12" height="10" rx="2" />
        <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
      </>
    ),
    check: <path d="m5 12 4 4 10-10" />
  };

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/15">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icons[type]}
      </svg>
    </span>
  );
}

function StatusTag({ locked, free }) {
  if (free) {
    return <span className="tag bg-green-100 text-green-700 ring-1 ring-green-200">Free</span>;
  }

  if (locked) {
    return (
      <span className="tag inline-flex items-center gap-1 bg-ink/5 text-ink/50 ring-1 ring-ink/5">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="10" width="12" height="10" rx="2" />
          <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
        </svg>
        Locked
      </span>
    );
  }

  return <span className="tag bg-accent/10 text-accent ring-1 ring-accent/15">Unlocked</span>;
}

function ItemRow({ href, title, meta, locked, free }) {
  const inner = (
    <div className={`group flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm transition duration-300 ${locked ? 'opacity-60' : 'hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-lg'}`}>
      <div className="min-w-0">
        <p className="font-semibold leading-6 group-hover:text-accent">{title}</p>
        {meta && <p className="mt-1 text-xs text-ink/50">{meta}</p>}
      </div>
      <StatusTag locked={locked} free={free} />
    </div>
  );
  return locked ? inner : <Link href={href} className="block">{inner}</Link>;
}

function ContentSection({ type, title, count, children }) {
  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white/70 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBadge type={type} />
          <div>
            <h2 className="text-xl font-bold tracking-tight"><TextReveal text={title} /></h2>
            <p className="text-xs text-ink/50">{count} {count === 1 ? 'item' : 'items'}</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default async function CoursePage({ params }) {
  const supabase = createClient();
  const { data: course } = await supabase.from('courses').select('*').eq('id', params.id).maybeSingle();
  if (!course) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let enrolled = false;
  if (user) {
    const { data: e } = await supabase.from('enrollments').select('id')
      .eq('user_id', user.id).eq('course_id', course.id).maybeSingle();
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    enrolled = Boolean(e) || p?.role === 'admin';
  }

  const [{ data: videos }, { data: notes }, { data: tests }] = await Promise.all([
    supabase.from('videos').select('*').eq('course_id', course.id).order('position'),
    supabase.from('notes').select('*').eq('course_id', course.id).order('position'),
    supabase.from('mock_tests').select('*').eq('course_id', course.id).order('position')
  ]);

  const canOpen = (item) => item.is_free || enrolled;

  return (
    <div className="container-x py-12 sm:py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-accent/10" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Course library</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{course.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/60">{course.description}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-ink/60">
                <span className="tag bg-ink/5 text-ink/60">{videos?.length ?? 0} videos</span>
                <span className="tag bg-ink/5 text-ink/60">{tests?.length ?? 0} tests</span>
                <span className="tag bg-ink/5 text-ink/60">{notes?.length ?? 0} notes</span>
              </div>
            </div>
            {!enrolled && (
              <Link href={`/checkout/${course.id}`} className="btn-primary relative shrink-0">
                Enroll for Rs. {course.price_inr}
              </Link>
            )}
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Reveal>
          <ContentSection type="video" title="Videos" count={videos?.length ?? 0}>
            {(videos ?? []).map((v) => (
              <ItemRow key={v.id} href={`/courses/${course.id}/video/${v.id}`} title={v.title}
                meta={v.duration_minutes ? `${v.duration_minutes} min` : null}
                locked={!canOpen(v)} free={v.is_free} />
            ))}
          </ContentSection>
        </Reveal>

        <Reveal delay={0.08}>
          <ContentSection type="test" title="Mock Tests" count={tests?.length ?? 0}>
            {(tests ?? []).map((t) => (
              <ItemRow key={t.id} href={`/tests/${t.id}`} title={t.title}
                meta={`${t.duration_minutes} min`} locked={!canOpen(t)} free={t.is_free} />
            ))}
          </ContentSection>
        </Reveal>

        <Reveal delay={0.16}>
          <ContentSection type="notes" title="Notes" count={notes?.length ?? 0}>
            {(notes ?? []).map((n) => (
              <ItemRow key={n.id} href={`/courses/${course.id}/notes/${n.id}`} title={n.title}
                locked={!canOpen(n)} free={n.is_free} />
            ))}
          </ContentSection>
        </Reveal>
      </div>
    </div>
  );
}
