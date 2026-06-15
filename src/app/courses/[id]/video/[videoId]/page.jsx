import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAccess } from '@/lib/access';
import { Reveal } from '@/components/Reveal';

export default async function VideoPage({ params }) {
  const supabase = createClient();
  const { data: video } = await supabase.from('videos').select('*')
    .eq('id', params.videoId).eq('course_id', params.id).maybeSingle();
  if (!video) notFound();

  const { allowed, user } = await checkAccess({ isFree: video.is_free, courseId: params.id });

  if (!allowed) {
    return (
      <div className="container-x py-24 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-2xl font-bold">This video is locked</h1>
        <p className="mt-2 text-ink/60">{user ? 'Enroll in this course to unlock all videos.' : 'Login and enroll to unlock all videos.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          {!user && <Link href="/login" className="btn-ghost">Login</Link>}
          <Link href={`/checkout/${params.id}`} className="btn-primary">Unlock Course</Link>
        </div>
      </div>
    );
  }

  // Access verified server-side; fetch the protected URL with the service role.
  const admin = createAdminClient();
  const { data: source } = await admin.from('video_sources').select('url').eq('video_id', video.id).maybeSingle();

  return (
    <div className="container-x py-12">
      <Reveal>
        <Link href={`/courses/${params.id}`} className="text-sm text-ink/50 hover:text-accent">← Back to course</Link>
        <h1 className="mt-2 text-2xl font-bold">{video.title}</h1>
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-black">
          {source?.url ? (
            <iframe src={source.url} className="h-full w-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          ) : (
            <p className="p-8 text-white">Video source not configured yet.</p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
