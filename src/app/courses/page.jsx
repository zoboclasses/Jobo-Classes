import { createClient } from '@/lib/supabase/server';
import { TextReveal } from '@/components/Reveal';
import CourseCard from '@/components/CourseCard';

export const revalidate = 60;

export default async function CoursesPage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from('courses').select('*').eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="container-x py-16">
      <h1 className="text-4xl font-bold tracking-tight"><TextReveal text="All Courses" /></h1>
      <p className="mt-2 text-ink/60">Every course includes free demo videos, sample notes and a free mock test.</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(courses ?? []).map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
        {!courses?.length && <p className="text-ink/50">No courses published yet. Check back soon!</p>}
      </div>
    </div>
  );
}
