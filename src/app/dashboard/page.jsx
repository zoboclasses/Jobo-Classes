import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Reveal, TextReveal } from '@/components/Reveal';
import DashboardSignOut from '@/components/DashboardSignOut';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: enrollments }, { data: attempts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('enrollments').select('id, created_at, courses(id, title, price_inr)').eq('user_id', user.id),
    supabase.from('test_attempts').select('id, score, total, created_at, mock_tests(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
  ]);

  return (
    <div className="container-x py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        <TextReveal text={`Hi, ${profile?.full_name || user.email || 'Learner'} 👋`} />
      </h1>
      {profile?.role === 'admin' && (
        <Reveal><Link href="/admin" className="btn-ghost mt-4 inline-flex">Open Admin Panel</Link></Reveal>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-semibold">My Courses</h2>
          <div className="space-y-3">
            {(enrollments ?? []).map((e) => (
              <Reveal key={e.id}>
                <Link href={`/courses/${e.courses.id}`} className="card block !p-4">
                  <p className="font-medium">{e.courses.title}</p>
                  <p className="text-xs text-ink/50">Enrolled {new Date(e.created_at).toLocaleDateString()}</p>
                </Link>
              </Reveal>
            ))}
            {!enrollments?.length && (
              <p className="text-sm text-ink/50">No courses yet. <Link href="/courses" className="text-accent">Browse courses →</Link></p>
            )}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-xl font-semibold">Recent Test Attempts</h2>
          <div className="space-y-3">
            {(attempts ?? []).map((a) => (
              <Reveal key={a.id}>
                <div className="card flex items-center justify-between !p-4">
                  <div>
                    <p className="font-medium">{a.mock_tests?.title}</p>
                    <p className="text-xs text-ink/50">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <span className="tag bg-accent/10 text-accent">{a.score} / {a.total}</span>
                </div>
              </Reveal>
            ))}
            {!attempts?.length && <p className="text-sm text-ink/50">No attempts yet.</p>}
          </div>
        </section>
      </div>

      <DashboardSignOut />
    </div>
  );
}
