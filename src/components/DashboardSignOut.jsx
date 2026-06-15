'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DashboardSignOut() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="mt-24 flex justify-center">
      <button
        onClick={signOut}
        className="rounded-full border border-ink/10 bg-white px-8 py-3 text-sm font-semibold text-red-600 shadow-lg shadow-ink/5 transition hover:border-red-200 hover:bg-red-50"
      >
        Sign out
      </button>
    </div>
  );
}
