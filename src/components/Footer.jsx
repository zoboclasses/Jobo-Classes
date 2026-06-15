import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/5 bg-white/70 py-12">
      <div className="container-x">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-lg font-bold tracking-tight">Jobo<span className="text-accent">Classes</span></p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-ink/60">
              Government exam preparation with courses, mock tests, and revision notes built for focused learning.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/45">Support</h3>
            <div className="mt-4 space-y-2 text-sm text-ink/65">
              <p>Helpline: <a href="tel:+919876543210" className="hover:text-accent">+91 98765 43210</a></p>
              <p>Email: <a href="mailto:help@joboclasses.com" className="hover:text-accent">help@joboclasses.com</a></p>
              <p>Hours: Mon-Sat, 10 AM - 6 PM</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/45">Quick Links</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-ink/65">
              <Link href="/courses" className="hover:text-accent">Courses</Link>
              <Link href="/dashboard" className="hover:text-accent">Dashboard</Link>
              <Link href="/login" className="hover:text-accent">Login</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-ink/5 pt-6 text-xs text-ink/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Jobo Classes. All rights reserved.</p>
          <p>Government exam preparation, made simple.</p>
        </div>
      </div>
    </footer>
  );
}
