"use client";

import { useRef, useEffect } from "react";
import { Source } from "@/data/types";
import { SourcePill } from "./source-pill";

interface EntryBriefProps {
  content: string;
  isStreaming: boolean;
  allSources: Source[];
}

export function EntryBrief({ content, isStreaming, allSources }: EntryBriefProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll while streaming
  useEffect(() => {
    if (isStreaming && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [content, isStreaming]);

  if (!content) return null;

  return (
    <section className="pb-16 pt-8">
      {/* Brief header */}
      <div className="mb-6 border-b border-border pb-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-accent">
          Entry Brief
        </p>
        <h2 className="font-headline text-ink">
          Your GCC setup overview
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Generated from sourced data · not financial advice
        </p>
      </div>

      {/* Brief body: rendered as HTML from markdown */}
      <div
        className="prose-brief"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Generating…
        </div>
      )}

      <div ref={endRef} />

      {/* Sources bibliography */}
      {!isStreaming && allSources.length > 0 && (
        <div className="mt-10 border-t border-border pt-6">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-faint">
            Sources referenced
          </h3>
          <div className="flex flex-wrap gap-2">
            {allSources.map((source, i) => (
              <SourcePill key={`${source.name}-${i}`} source={source} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
