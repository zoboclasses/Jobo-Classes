import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAccess } from '@/lib/access';
import TestRunner from './TestRunner';

export default async function TestPage({ params }) {
  const supabase = createClient();
  const { data: test } = await supabase.from('mock_tests').select('*').eq('id', params.testId).maybeSingle();
  if (!test) notFound();

  const { allowed, user } = await checkAccess({ isFree: test.is_free, courseId: test.course_id });
  if (!allowed) {
    return (
      <div className="container-x py-24 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-2xl font-bold">This mock test is locked</h1>
        <div className="mt-6 flex justify-center gap-3">
          {!user && <Link href="/login" className="btn-ghost">Login</Link>}
          <Link href={`/checkout/${test.course_id}`} className="btn-primary">Unlock Course</Link>
        </div>
      </div>
    );
  }

  // Server-side fetch WITHOUT correct answers.
  const admin = createAdminClient();
  const { data: questions } = await admin.from('questions')
    .select('id, question, options, marks, negative_marks, position')
    .eq('test_id', test.id).order('position');

  return <TestRunner test={test} questions={questions ?? []} />;
}
