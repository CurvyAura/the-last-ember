"use client";

import React from "react";
// no types imported (keep component props minimal)

export default function PostRunModal({ open, onReset, recentLog = [], daysSurvived = 0, }: { open: boolean; onReset: () => void; recentLog?: string[]; daysSurvived?: number; }) {
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onReset();
      }
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      const el = modalRef.current?.querySelector<HTMLElement>("button:not(:disabled)");
      el?.focus();
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onReset]);

  if (!open) return null;

  const title = "Run Summary";

  // Decide button text by run stage. Keep pragmatic labels for the survival pivot.
  const stage = daysSurvived <= 2 ? "early" : daysSurvived <= 7 ? "mid" : "late";
  const buttonText = stage === "early" ? "Try again" : stage === "mid" ? "Restart" : "Start new run";

  const flavor = (
    <>
      <p className="mb-2">Run complete — summary and tips below.</p>
      <div className="text-xs text-zinc-500">
        <div>Days survived: <span className="font-medium">{daysSurvived}</span></div>
        <div className="mt-2">Tips: Gather wood, tend your fire, eat when hungry, and rest to recover.</div>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Run complete">
      <div ref={modalRef} className="w-full max-w-md rounded bg-white p-6 dark:bg-zinc-900">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>

        <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
          {flavor}
        </div>

        {recentLog.length > 0 && (
          <div className="mb-3 rounded border border-zinc-100 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
            <div className="font-medium mb-1">Last moments</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">
              {recentLog.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap">{l}</div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end">
          <button
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50"
            onClick={onReset}
            aria-label="Start a new run"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
