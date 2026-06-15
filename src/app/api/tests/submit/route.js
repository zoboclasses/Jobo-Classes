import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// UUID v4 format check
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { testId, answers } = await request.json();

  // FIX #3: Validate testId
  if (!testId || !UUID_RE.test(testId)) {
    return NextResponse.json({ error: 'Invalid test' }, { status: 400 });
  }

  // Validate answers is a plain object (not array, null, etc.)
  if (answers && (typeof answers !== 'object' || Array.isArray(answers))) {
    return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: test } = await admin.from('mock_tests').select('*').eq('id', testId).maybeSingle();
  if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

  // Re-verify access server-side
  if (!test.is_free) {
    const { data: enrollment } = await admin.from('enrollments').select('id')
      .eq('user_id', user.id).eq('course_id', test.course_id).maybeSingle();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!enrollment && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }
  }

  const { data: questions } = await admin.from('questions').select('*').eq('test_id', testId);
  let score = 0, total = 0, correctCount = 0, wrongCount = 0, skipped = 0;
  const correctMap = {};
  for (const q of questions ?? []) {
    total += Number(q.marks);
    correctMap[q.id] = { correct: q.correct_index, explanation: q.explanation || null };
    const picked = answers?.[q.id];
    if (picked === undefined || picked === null) { skipped++; continue; }
    if (Number(picked) === q.correct_index) { score += Number(q.marks); correctCount++; }
    else { score -= Number(q.negative_marks); wrongCount++; }
  }
  score = Math.round(score * 100) / 100;

  await admin.from('test_attempts').insert({
    user_id: user.id, test_id: testId, score, total, answers: answers ?? {}
  });

  return NextResponse.json({ score, total, correctCount, wrongCount, skipped, correctMap });
}
