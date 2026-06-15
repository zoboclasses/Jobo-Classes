'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState({}); // testId -> []
  const [vForm, setVForm] = useState({ title: '', url: '', duration_minutes: '', is_free: false });
  const [nForm, setNForm] = useState({ title: '', url: '', is_free: false });
  const [tForm, setTForm] = useState({ title: '', duration_minutes: 30, is_free: false });
  const [qForm, setQForm] = useState({ testId: '', question: '', o1: '', o2: '', o3: '', o4: '', correct: 0, marks: 1, negative: 0, explanation: '' });

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return router.push('/');
    const [c, v, n, t] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).maybeSingle(),
      supabase.from('videos').select('*').eq('course_id', id).order('position'),
      supabase.from('notes').select('*').eq('course_id', id).order('position'),
      supabase.from('mock_tests').select('*').eq('course_id', id).order('position')
    ]);
    setCourse(c.data); setVideos(v.data ?? []); setNotes(n.data ?? []); setTests(t.data ?? []);
    if (t.data?.length) {
      const { data: qs } = await supabase.from('questions').select('*').in('test_id', t.data.map((x) => x.id)).order('position');
      const grouped = {};
      (qs ?? []).forEach((q) => { (grouped[q.test_id] ||= []).push(q); });
      setQuestions(grouped);
    }
  }
  useEffect(() => { load(); }, [id]);

  async function addVideo(e) {
    e.preventDefault();
    const { data, error } = await supabase.from('videos').insert({
      course_id: id, title: vForm.title, duration_minutes: Number(vForm.duration_minutes) || null,
      is_free: vForm.is_free, position: videos.length + 1
    }).select().single();
    if (error) return alert(error.message);
    await supabase.from('video_sources').insert({ video_id: data.id, url: vForm.url });
    setVForm({ title: '', url: '', duration_minutes: '', is_free: false }); load();
  }

  async function addNote(e) {
    e.preventDefault();
    const { data, error } = await supabase.from('notes').insert({
      course_id: id, title: nForm.title, is_free: nForm.is_free, position: notes.length + 1
    }).select().single();
    if (error) return alert(error.message);
    await supabase.from('note_files').insert({ note_id: data.id, url: nForm.url });
    setNForm({ title: '', url: '', is_free: false }); load();
  }

  async function addTest(e) {
    e.preventDefault();
    const { error } = await supabase.from('mock_tests').insert({
      course_id: id, title: tForm.title, duration_minutes: Number(tForm.duration_minutes) || 30,
      is_free: tForm.is_free, position: tests.length + 1
    });
    if (error) return alert(error.message);
    setTForm({ title: '', duration_minutes: 30, is_free: false }); load();
  }

  async function addQuestion(e) {
    e.preventDefault();
    const { error } = await supabase.from('questions').insert({
      test_id: qForm.testId, question: qForm.question,
      options: [qForm.o1, qForm.o2, qForm.o3, qForm.o4],
      correct_index: Number(qForm.correct), marks: Number(qForm.marks), negative_marks: Number(qForm.negative),
      explanation: qForm.explanation || null,
      position: (questions[qForm.testId]?.length ?? 0) + 1
    });
    if (error) return alert(error.message);
    setQForm({ ...qForm, question: '', o1: '', o2: '', o3: '', o4: '', explanation: '' }); load();
  }

  async function remove(table, itemId) {
    if (!confirm('Delete this item?')) return;
    await supabase.from(table).delete().eq('id', itemId); load();
  }

  async function toggleFree(table, item) {
    await supabase.from(table).update({ is_free: !item.is_free }).eq('id', item.id); load();
  }

  if (!course) return <div className="container-x py-24 text-center text-ink/50">Loading...</div>;

  const FreeTag = ({ table, item }) => (
    <button onClick={() => toggleFree(table, item)}
      className={`tag border ${item.is_free ? 'border-green-300 bg-green-50 text-green-700' : 'border-ink/15 text-ink/50'}`}>
      {item.is_free ? 'Free sample' : 'Paid'}
    </button>
  );

  return (
    <div className="container-x py-16">
      <Link href="/admin" className="text-sm text-ink/50 hover:text-accent">← All courses</Link>
      <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>

      {/* Videos */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">🎥 Videos</h2>
        <form onSubmit={addVideo} className="card mt-3 grid gap-3 sm:grid-cols-5">
          <input className="input" placeholder="Title" value={vForm.title} onChange={(e) => setVForm({ ...vForm, title: e.target.value })} required />
          <input className="input" placeholder="Embed URL (YouTube/Vimeo)" value={vForm.url} onChange={(e) => setVForm({ ...vForm, url: e.target.value })} required />
          <input className="input" type="number" placeholder="Minutes" value={vForm.duration_minutes} onChange={(e) => setVForm({ ...vForm, duration_minutes: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={vForm.is_free} onChange={(e) => setVForm({ ...vForm, is_free: e.target.checked })} /> Free demo</label>
          <button className="btn-primary">+ Add</button>
        </form>
        <div className="mt-3 space-y-2">
          {videos.map((v) => (
            <div key={v.id} className="card flex items-center justify-between !p-3 text-sm">
              <span>{v.title}</span>
              <span className="flex items-center gap-2">
                <FreeTag table="videos" item={v} />
                <button onClick={() => remove('videos', v.id)} className="text-red-500">Delete</button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">📒 Notes</h2>
        <form onSubmit={addNote} className="card mt-3 grid gap-3 sm:grid-cols-4">
          <input className="input" placeholder="Title" value={nForm.title} onChange={(e) => setNForm({ ...nForm, title: e.target.value })} required />
          <input className="input" placeholder="PDF URL" value={nForm.url} onChange={(e) => setNForm({ ...nForm, url: e.target.value })} required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={nForm.is_free} onChange={(e) => setNForm({ ...nForm, is_free: e.target.checked })} /> Free sample</label>
          <button className="btn-primary">+ Add</button>
        </form>
        <div className="mt-3 space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="card flex items-center justify-between !p-3 text-sm">
              <span>{n.title}</span>
              <span className="flex items-center gap-2">
                <FreeTag table="notes" item={n} />
                <button onClick={() => remove('notes', n.id)} className="text-red-500">Delete</button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Mock tests */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">📝 Mock Tests</h2>
        <form onSubmit={addTest} className="card mt-3 grid gap-3 sm:grid-cols-4">
          <input className="input" placeholder="Test title" value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} required />
          <input className="input" type="number" placeholder="Duration (min)" value={tForm.duration_minutes} onChange={(e) => setTForm({ ...tForm, duration_minutes: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tForm.is_free} onChange={(e) => setTForm({ ...tForm, is_free: e.target.checked })} /> Free</label>
          <button className="btn-primary">+ Add Test</button>
        </form>

        {tests.map((t) => (
          <div key={t.id} className="card mt-4 !p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t.title} <span className="text-xs text-ink/40">({(questions[t.id] ?? []).length} questions)</span></p>
              <span className="flex items-center gap-2">
                <FreeTag table="mock_tests" item={t} />
                <button onClick={() => remove('mock_tests', t.id)} className="text-sm text-red-500">Delete</button>
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-ink/70">
              {(questions[t.id] ?? []).map((q, i) => (
                <li key={q.id} className="flex justify-between">
                  <span>{i + 1}. {q.question}</span>
                  <button onClick={() => remove('questions', q.id)} className="text-red-400">×</button>
                </li>
              ))}
            </ul>
            <form onSubmit={(e) => { setQForm({ ...qForm, testId: t.id }); addQuestion(e); }}
              onFocus={() => qForm.testId !== t.id && setQForm({ ...qForm, testId: t.id })}
              className="mt-3 grid gap-2 border-t border-ink/5 pt-3 sm:grid-cols-2">
              <input className="input sm:col-span-2" placeholder="Question text" value={qForm.testId === t.id ? qForm.question : ''} onChange={(e) => setQForm({ ...qForm, testId: t.id, question: e.target.value })} required />
              {['o1', 'o2', 'o3', 'o4'].map((k, i) => (
                <input key={k} className="input" placeholder={`Option ${i + 1}`} value={qForm.testId === t.id ? qForm[k] : ''} onChange={(e) => setQForm({ ...qForm, testId: t.id, [k]: e.target.value })} required />
              ))}
              <select className="input" value={qForm.correct} onChange={(e) => setQForm({ ...qForm, testId: t.id, correct: e.target.value })}>
                {[0, 1, 2, 3].map((i) => <option key={i} value={i}>Correct: Option {i + 1}</option>)}
              </select>
              <div className="flex gap-2">
                <input className="input" type="number" step="0.5" placeholder="Marks" value={qForm.marks} onChange={(e) => setQForm({ ...qForm, testId: t.id, marks: e.target.value })} />
                <input className="input" type="number" step="0.25" placeholder="Negative" value={qForm.negative} onChange={(e) => setQForm({ ...qForm, testId: t.id, negative: e.target.value })} />
                <button className="btn-primary shrink-0">+ Q</button>
              </div>
              <textarea className="input sm:col-span-2 !h-auto" rows="2" placeholder="Explanation (optional) — shown after test submission" value={qForm.testId === t.id ? qForm.explanation : ''} onChange={(e) => setQForm({ ...qForm, testId: t.id, explanation: e.target.value })} />
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
