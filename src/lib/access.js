import { createClient } from '@/lib/supabase/server';

// Server-side access check: free item, enrolled user, or admin.
export async function checkAccess({ isFree, courseId }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (isFree) return { allowed: true, user };
  if (!user) return { allowed: false, user: null };
  const { data: enrollment } = await supabase
    .from('enrollments').select('id')
    .eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
  if (enrollment) return { allowed: true, user };
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  return { allowed: profile?.role === 'admin', user };
}
