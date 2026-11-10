export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading">
      <div className="h-8 w-48 rounded-lg bg-panel2" />
      <div className="h-4 w-72 rounded bg-panel2" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-panel2" />)}
      </div>
      <div className="h-64 rounded-xl bg-panel2" />
    </div>
  );
}
