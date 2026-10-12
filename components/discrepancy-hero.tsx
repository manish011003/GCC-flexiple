import { gccCounts } from "@/data/gcc-counts";
import { SourcePill } from "./source-pill";

export function DiscrepancyHero() {
  const sorted = [...gccCounts].sort((a, b) => a.count - b.count);

  return (
    <section className="pb-12 pt-16 sm:pb-16 sm:pt-24">
      {/* Editorial lead-in */}
      <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
        Groundtruth
      </p>
      <h1 className="mb-6 font-headline text-ink">
        How many GCCs does India have?
        <br />
        <span className="text-ink-muted">It depends who you ask.</span>
      </h1>

      <p className="mb-8 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
        Published reports disagree on the total number of Global Capability
        Centres operating in India. The gap isn&apos;t error: it&apos;s
        methodology. Here are the numbers, side by side.
      </p>

      {/* Count comparison */}
      <div className="mb-6 overflow-hidden rounded-lg border border-border bg-bg-elevated">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
                Source
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-faint">
                Count
              </th>
              <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-faint sm:table-cell">
                Methodology
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr
                key={entry.sourceName}
                className={
                  i < sorted.length - 1 ? "border-b border-border" : ""
                }
              >
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-ink">
                      {entry.sourceName}
                    </span>
                    <div className="sm:hidden">
                      <span className="text-xs text-ink-muted">
                        {entry.methodologyNote}
                      </span>
                    </div>
                    <SourcePill source={entry.sources[0]} />
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="font-headline text-xl font-medium tabular-nums text-ink">
                    {entry.count.toLocaleString("en-IN")}
                  </span>
                  {entry.asOfDate && (
                    <span className="ml-1.5 text-xs text-ink-faint">
                      ({entry.asOfDate})
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3.5 sm:table-cell">
                  <span className="text-sm text-ink-muted">
                    {entry.methodologyNote}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gap callout */}
      <div className="rounded-lg border border-accent/20 bg-accent-light/40 px-4 py-3">
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-accent-dark">
            A {Math.max(...sorted.map((e) => e.count)) - Math.min(...sorted.map((e) => e.count))}+ gap
          </span>{" "}
          (driven by how each source defines &ldquo;GCC&rdquo;, whether they
          count subsidiaries, and their cutoff date).{" "}
          <a
            href="/methodology"
            className="font-medium text-accent underline decoration-accent/40 underline-offset-2 transition-editorial hover:decoration-accent"
          >
            See full methodology comparison →
          </a>
        </p>
      </div>
    </section>
  );
}
