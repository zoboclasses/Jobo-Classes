import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink/60">The page you are looking for does not exist or was moved.</p>
      <Link href="/" className="btn-primary mt-8 inline-flex">Back to Home</Link>
    </div>
  );
}
