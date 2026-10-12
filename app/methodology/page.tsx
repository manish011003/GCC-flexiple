import { gccCounts } from "@/data/gcc-counts";
import { SourcePill } from "@/components/source-pill";
import Link from "next/link";

export default function MethodologyPage() {
  return (
    <div className="pb-24 pt-16 sm:pt-24">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-editorial hover:text-accent"
      >
        ← Back to Groundtruth
      </Link>

      <h1 className="mb-4 font-headline text-ink">
        How we count and why others count differently
      </h1>

      <p className="mb-8 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
        There is no single &ldquo;official&rdquo; count of GCCs in India.
        Each major source uses a different definition, scope, and cutoff
        date. Understanding these differences is essential to interpreting
        any GCC statistic.
      </p>

      <div className="space-y-8">
        {gccCounts.map((entry) => (
          <article
            key={entry.sourceName}
            className="rounded-lg border border-border bg-bg-elevated p-5 sm:p-6"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-headline text-lg font-medium text-ink">
                  {entry.sourceName}
                </h2>
                <span className="text-sm text-ink-muted">
                  Reported: {entry.asOfDate || "Date not specified"}
                </span>
              </div>
              <span className="flex-shrink-0 font-headline text-2xl font-medium tabular-nums text-accent">
                {entry.count.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                Methodology
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                {entry.methodologyNote}
              </p>
            </div>

            {entry.includes && (
              <div className="mb-4">
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Includes
                </h3>
                <ul className="space-y-1">
                  {entry.includes.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-ink-muted"
                    >
                      <span className="text-accent">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {entry.excludes && (
              <div className="mb-4">
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Excludes
                </h3>
                <ul className="space-y-1">
                  {entry.excludes.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-ink-muted"
                    >
                      <span className="text-ink-faint">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {entry.sources.map((source, i) => (
                <SourcePill
                  key={`${source.name}-${i}`}
                  source={source}
                />
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Editorial note */}
      <div className="mt-12 rounded-lg border border-accent/20 bg-accent-light/40 px-5 py-4">
        <h3 className="mb-2 font-headline text-base font-medium text-accent-dark">
          Our approach
        </h3>
        <p className="text-sm leading-relaxed text-ink-muted">
          Groundtruth does not publish a single &ldquo;correct&rdquo;
          count. Instead, we present each source&apos;s figure alongside
          its methodology so decision-makers can judge the numbers in
          context. When computing recommendations in your Entry Brief, we
          use the intersection (entities that appear across multiple
          sources) as our working baseline.
        </p>
      </div>
    </div>
  );
}
