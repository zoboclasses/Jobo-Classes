'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Reveal } from '@/components/Reveal';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function emailAuth(e) {
    e.preventDefault(); setLoading(true); setMsg('');
    const { email, password, name } = form;
    const { error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMsg(error.message);
    if (mode === 'signup') return setMsg('Check your email to confirm your account.');
    router.push('/dashboard'); router.refresh();
  }

  async function googleAuth() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    });
  }

  return (
    <div className="container-x flex justify-center py-20">
      <Reveal className="w-full max-w-md">
        <div className="card !p-8">
          <h1 className="text-2xl font-bold">{mode === 'signup' ? 'Create account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-ink/60">Access free demos, mock tests and your courses.</p>

          <form onSubmit={emailAuth} className="mt-6 space-y-3">
            {mode === 'signup' && <input className="input" placeholder="Full name" value={form.name} onChange={set('name')} required />}
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
            <input className="input" type="password" placeholder="Password" value={form.password} onChange={set('password')} required minLength={6} />
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Sign in'}</button>
            <p className="text-center text-sm text-ink/60">
              {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
              <button type="button" className="font-medium text-accent" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
                {mode === 'signup' ? 'Sign in' : 'Create account'}
              </button>
            </p>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-ink/40">
            <div className="h-px flex-1 bg-ink/10" />or<div className="h-px flex-1 bg-ink/10" />
          </div>
          <button onClick={googleAuth} className="btn-ghost w-full">Continue with Google</button>
          {msg && <p className="mt-4 text-center text-sm text-accent">{msg}</p>}
        </div>
      </Reveal>
    </div>
  );
}
