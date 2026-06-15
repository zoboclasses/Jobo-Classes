import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAccess } from '@/lib/access';
import { Reveal } from '@/components/Reveal';

export default async function NotePage({ params }) {
  const supabase = createClient();
  const { data: note } = await supabase.from('notes').select('*')
    .eq('id', params.noteId).eq('course_id', params.id).maybeSingle();
  if (!note) notFound();

  const { allowed, user } = await checkAccess({ isFree: note.is_free, courseId: params.id });

  if (!allowed) {
    return (
      <div className="container-x py-24 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-2xl font-bold">These notes are locked</h1>
        <p className="mt-2 text-ink/60">{user ? 'Enroll in this course to unlock all notes.' : 'Login and enroll to unlock all notes.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          {!user && <Link href="/login" className="btn-ghost">Login</Link>}
          <Link href={`/checkout/${params.id}`} className="btn-primary">Unlock Course</Link>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: file } = await admin.from('note_files').select('url').eq('note_id', note.id).maybeSingle();

  return (
    <div className="container-x py-12">
      <Reveal>
        <Link href={`/courses/${params.id}`} className="text-sm text-ink/50 hover:text-accent">← Back to course</Link>
        <h1 className="mt-2 text-2xl font-bold">{note.title}</h1>
        <div className="mt-6 h-[80vh] overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {file?.url ? (
            <iframe src={file.url} className="h-full w-full" />
          ) : (
            <p className="p-8 text-ink/60">Note file not configured yet.</p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
