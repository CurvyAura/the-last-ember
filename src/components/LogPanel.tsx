"use client";

import React, { useRef, useEffect } from "react";

export default function LogPanel({ log }: { log: string[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll to bottom whenever log changes
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [log]);

  return (
    <div 
      ref={containerRef}
      className="h-64 overflow-auto rounded border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div
        className="space-y-2"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        tabIndex={0}
      >
        {log.slice(-50).map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
            {line}
          </div>
        ))}
        {/* Invisible div at the bottom to scroll to */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
