'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', price_inr: '' });
  const [thumbFile, setThumbFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [aForm, setAForm] = useState({ title: '', url: '', is_active: true });
  const [ready, setReady] = useState(false);
  const thumbInputRef = useRef(null);
  const thumbUpdateRefs = useRef({});

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return router.push('/');
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('position')
    ]);
    setCourses(c ?? []);
    setAnnouncements(a ?? []);
    setReady(true);
  }
  useEffect(() => { load(); }, []);

  // --- Upload helper ---
  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  // --- Courses ---
  async function createCourse(e) {
    e.preventDefault();
    setUploading(true);
    try {
      let thumbnail_url = null;
      if (thumbFile) {
        thumbnail_url = await uploadFile(thumbFile);
      }
      const { error } = await supabase.from('courses').insert({
        title: form.title, description: form.description,
        price_inr: Number(form.price_inr) || 0, thumbnail_url
      });
      if (error) return alert(error.message);
      setForm({ title: '', description: '', price_inr: '' });
      setThumbFile(null);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function updateThumbnail(courseId, file) {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      await supabase.from('courses').update({ thumbnail_url: url }).eq('id', courseId);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function togglePublish(c) {
    await supabase.from('courses').update({ is_published: !c.is_published }).eq('id', c.id);
    load();
  }

  async function removeCourse(id) {
    if (!confirm('Delete this course and ALL its content?')) return;
    await supabase.from('courses').delete().eq('id', id);
    load();
  }

  // --- Announcements ---
  async function addAnnouncement(e) {
    e.preventDefault();
    const { error } = await supabase.from('announcements').insert({
      title: aForm.title, url: aForm.url, is_active: aForm.is_active,
      position: announcements.length + 1
    });
    if (error) return alert(error.message);
    setAForm({ title: '', url: '', is_active: true });
    load();
  }

  async function toggleActive(a) {
    await supabase.from('announcements').update({ is_active: !a.is_active }).eq('id', a.id);
    load();
  }

  async function removeAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    load();
  }

  if (!ready) return <div className="container-x py-24 text-center text-ink/50">Loading...</div>;

  return (
    <div className="container-x py-16">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      {/* Announcements section */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">📢 Announcements (Homepage Marquee)</h2>
        <form onSubmit={addAnnouncement} className="card mt-3 grid gap-3 sm:grid-cols-4">
          <input className="input" placeholder="Title (e.g. SSC CGL 2026 Form Out)" value={aForm.title} onChange={(e) => setAForm({ ...aForm, title: e.target.value })} required />
          <input className="input" placeholder="URL (external link)" value={aForm.url} onChange={(e) => setAForm({ ...aForm, url: e.target.value })} required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={aForm.is_active} onChange={(e) => setAForm({ ...aForm, is_active: e.target.checked })} /> Active</label>
          <button className="btn-primary">+ Add</button>
        </form>
        <div className="mt-3 space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 !p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{a.title}</p>
                <p className="text-xs text-ink/40 truncate">{a.url}</p>
              </div>
              <span className="flex items-center gap-2">
                <button onClick={() => toggleActive(a)}
                  className={`tag border ${a.is_active ? 'border-green-300 bg-green-50 text-green-700' : 'border-ink/15 text-ink/50'}`}>
                  {a.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => removeAnnouncement(a.id)} className="text-red-500">Delete</button>
              </span>
            </div>
          ))}
          {!announcements.length && <p className="text-sm text-ink/50">No announcements yet.</p>}
        </div>
      </section>

      {/* Courses section */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">📚 Courses</h2>
        <form onSubmit={createCourse} className="card mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="input" placeholder="Course title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="input" type="number" placeholder="Price (INR)" value={form.price_inr} onChange={(e) => setForm({ ...form, price_inr: e.target.value })} required />
          <div>
            <label className="block text-xs text-ink/50 mb-1">Thumbnail</label>
            <input ref={thumbInputRef} type="file" accept="image/*"
              onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
              className="w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-accent/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent" />
          </div>
          <button disabled={uploading} className="btn-primary">{uploading ? 'Uploading...' : '+ Add Course'}</button>
        </form>

        <div className="mt-4 space-y-3">
          {courses.map((c) => (
            <div key={c.id} className="card flex flex-wrap items-center justify-between gap-4 !p-4">
              <div className="flex items-center gap-4">
                {/* Thumbnail preview + update */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
                  {c.thumbnail_url ? (
                    <Image src={c.thumbnail_url} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl">📚</span>
                  )}
                  <input
                    ref={(el) => { thumbUpdateRefs.current[c.id] = el; }}
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateThumbnail(c.id, file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => thumbUpdateRefs.current[c.id]?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition hover:bg-black/40 hover:text-white"
                    title="Change thumbnail">
                    📷
                  </button>
                </div>
                <div>
                  <p className="font-medium">{c.title} <span className="text-ink/40">· ₹{c.price_inr}</span></p>
                  <span className={`tag ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-ink/5 text-ink/50'}`}>
                    {c.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/courses/${c.id}`} className="btn-ghost !px-4 !py-2">Edit Content</Link>
                <button onClick={() => togglePublish(c)} className="btn-ghost !px-4 !py-2">{c.is_published ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => removeCourse(c.id)} className="btn-ghost !px-4 !py-2 !text-red-500">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
