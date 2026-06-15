import Link from 'next/link';
import Image from 'next/image';
import { Reveal } from '@/components/Reveal';

export default function CourseCard({ course, index = 0 }) {
  return (
    <Reveal delay={index * 0.08}>
      <Link href={`/courses/${course.id}`} className="card group block">
        <div className="relative mb-4 h-36 overflow-hidden rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl">📚</span>
          )}
        </div>
        <h3 className="text-lg font-semibold group-hover:text-accent">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink/60">{course.description}</p>
        <p className="mt-4 text-lg font-bold">₹{course.price_inr}</p>
      </Link>
    </Reveal>
  );
}
