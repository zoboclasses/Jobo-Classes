import { createClient } from '@/lib/supabase/server';

export default async function AnnouncementBar() {
  const supabase = createClient();
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, url')
    .eq('is_active', true)
    .order('position');

  if (!announcements?.length) return null;

  // Build a repeated list for seamless scrolling
  const items = [...announcements, ...announcements, ...announcements, ...announcements];

  return (
    <div className="border-b border-ink/5 bg-white">
      <div className="container-x flex items-center gap-3 py-2.5">
        {/* Badge */}
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-green-800 px-3 py-1.5 text-white sm:px-4 sm:py-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="whitespace-nowrap text-xs font-bold sm:text-sm">
            Latest Update
          </span>
        </div>

        {/* Marquee wrapper — only this part clips overflow */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="announcement-marquee flex w-max items-center">
            {items.map((a, i) => (
              <span key={`${a.id}-${i}`} className="inline-flex shrink-0 items-center">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-sm font-semibold text-ink/80 transition-colors hover:text-accent"
                >
                  {a.title}
                </a>
                <span className="mx-4 text-ink/20 sm:mx-6">||</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
