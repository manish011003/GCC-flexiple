import { Source } from "@/data/types";

interface SourcePillProps {
  source: Source;
}

export function SourcePill({ source }: SourcePillProps) {
  return (
    <a
      href={source.url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-surface-source px-2.5 py-0.5 text-xs font-medium text-ink-muted transition-editorial hover:bg-border hover:text-ink"
      title={source.note || `${source.name}, ${source.date}`}
    >
      <span>{source.name}</span>
      <span className="text-ink-faint">{source.date}</span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        className="text-ink-faint"
        aria-hidden="true"
      >
        <path
          d="M3 7L7 3M7 3H4M7 3V6"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

interface SourceListProps {
  sources: Source[];
}

export function SourceList({ sources }: SourceListProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((source, i) => (
        <SourcePill key={`${source.name}-${i}`} source={source} />
      ))}
    </div>
  );
}
