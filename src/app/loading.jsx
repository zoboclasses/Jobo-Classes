export default function Loading() {
  return (
    <div className="container-x py-24">
      <div className="mx-auto max-w-3xl space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink/5" />
        ))}
      </div>
    </div>
  );
}
