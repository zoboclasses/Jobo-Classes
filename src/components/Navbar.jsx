'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import logo from '../../assets/logo-1.png';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const coursesActive = pathname?.startsWith('/courses');
  const dashboardActive = pathname?.startsWith('/dashboard');

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink/5 bg-paper/85 backdrop-blur-md">
        <nav className="container-x flex h-16 items-center justify-between gap-2">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight sm:gap-3 sm:text-lg">
            <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-accent/20 bg-ink shadow-sm sm:h-9 sm:w-9">
              <Image
                src={logo}
                alt="Jobo Classes logo"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </span>
            <span className="whitespace-nowrap">Jobo<span className="text-accent">Classes</span></span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 text-xs sm:gap-5 sm:text-sm">
            <Link
              href="/courses"
              className={`rounded-full px-2.5 py-2 transition sm:px-0 sm:py-0 ${coursesActive ? 'bg-accent/10 text-accent sm:bg-transparent' : 'hover:bg-ink/5 hover:text-accent sm:hover:bg-transparent'}`}
            >
              Courses
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className={`rounded-full px-3 py-2 transition sm:px-0 sm:py-0 ${dashboardActive ? 'bg-accent/10 text-accent sm:bg-transparent' : 'hover:bg-ink/5 hover:text-accent sm:hover:bg-transparent'}`}
              >
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="btn-primary whitespace-nowrap !px-3 !py-2 text-xs sm:!px-4 sm:text-sm">Login</Link>
            )}
          </div>
        </nav>
      </header>

    </>
  );
}
