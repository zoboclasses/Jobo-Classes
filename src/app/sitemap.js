import { createClient } from '@/lib/supabase/server';

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const supabase = createClient();
  const { data: courses } = await supabase
    .from('courses').select('id, created_at').eq('is_published', true);
  return [
    { url: base, priority: 1 },
    { url: `${base}/courses`, priority: 0.9 },
    ...(courses ?? []).map((c) => ({ url: `${base}/courses/${c.id}`, priority: 0.8 }))
  ];
}
