"use client";

import React from "react";
import type { Skills } from "../hooks/useGame";

export default function PostRunModal({ open, xp, onSpend, onReset, unlocked, }: { open: boolean; xp: number; onSpend: (skill: keyof Skills) => void; onReset: () => void; unlocked: Skills; }) {
  const cost = 3;
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onReset();
      }
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      // focus first focusable inside modal
      const el = modalRef.current?.querySelector<HTMLElement>("button:not(:disabled)");
      el?.focus();
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onReset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Run complete">
      <div ref={modalRef} className="w-full max-w-md rounded bg-white p-6 dark:bg-zinc-900">
        <h2 className="mb-2 text-lg font-semibold">Run complete</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">You earned <strong>{xp}</strong> XP from this run.</p>

        <div className="space-y-3">
          <SkillRow name="Fire Mastery" unlocked={unlocked.fireMastery} xp={xp} cost={cost} onSpend={() => onSpend("fireMastery")} />
          <SkillRow name="Hunting" unlocked={unlocked.hunting} xp={xp} cost={cost} onSpend={() => onSpend("hunting")} />
          <SkillRow name="Exploration" unlocked={unlocked.exploration} xp={xp} cost={cost} onSpend={() => onSpend("exploration")} />
        </div>

        <div className="mt-6 flex justify-between">
          <button className="rounded bg-zinc-200 px-3 py-2 text-sm" onClick={onReset}>
            Start new run
          </button>
          <span className="text-sm text-zinc-500">XP left: {xp}</span>
        </div>
      </div>
    </div>
  );
}

function SkillRow({ name, unlocked, xp, cost, onSpend }: { name: string; unlocked: boolean; xp: number; cost: number; onSpend: () => void }) {
  return (
    <div className="flex items-center justify-between rounded border border-zinc-100 p-2 dark:border-zinc-700">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-zinc-500">{unlocked ? "Unlocked" : `Cost ${cost} XP`}</div>
      </div>
      <div>
        <button
          className="rounded bg-indigo-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          onClick={onSpend}
          disabled={unlocked || xp < cost}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
