'use client';

export default function Error({ reset }) {
  return (
    <div className="container-x py-32 text-center">
      <p className="text-6xl">⚠️</p>
      <h1 className="mt-4 text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-ink/60">Please try again. If it keeps happening, contact support.</p>
      <button onClick={reset} className="btn-primary mt-8">Try again</button>
    </div>
  );
}
