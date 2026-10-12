export function BriefSkeleton() {
  return (
    <section className="pb-16 pt-8" aria-label="Loading brief">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="skeleton mb-3 h-8 w-3/4" />
        <div className="skeleton mb-2 h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>

      {/* Section 1: Scenario summary */}
      <div className="mb-8 rounded-lg border border-border bg-bg-elevated p-5">
        <div className="skeleton mb-3 h-5 w-40" />
        <div className="skeleton mb-2 h-3 w-full" />
        <div className="skeleton mb-2 h-3 w-5/6" />
        <div className="skeleton h-3 w-3/4" />
      </div>

      {/* Section 2: City shortlist */}
      <div className="mb-6">
        <div className="skeleton mb-4 h-6 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-bg-elevated p-4"
            >
              <div className="flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton mb-2 h-4 w-32" />
                  <div className="skeleton h-3 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Cost */}
      <div className="mb-6">
        <div className="skeleton mb-4 h-6 w-36" />
        <div className="skeleton mb-2 h-4 w-full" />
        <div className="skeleton mb-2 h-4 w-5/6" />
        <div className="skeleton h-4 w-2/3" />
      </div>

      {/* Section 4: Risks */}
      <div className="mb-6">
        <div className="skeleton mb-4 h-6 w-28" />
        <div className="skeleton mb-2 h-3 w-full" />
        <div className="skeleton mb-2 h-3 w-5/6" />
        <div className="skeleton h-3 w-4/5" />
      </div>
    </section>
  );
}
