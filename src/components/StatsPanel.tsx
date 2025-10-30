"use client";

import React from "react";
import type { GameState } from "../hooks/useGame";

export default function StatsPanel({ state }: { state: GameState }) {
  return (
    <section aria-label="Player stats" className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold">Stats</h3>
      <div className="space-y-3">
        {/* Health is a derived stat: average of warmth, hunger, thirst, and rest (0-10). */}
        <BarStat label="Health" value={Math.round((state.fire + state.hunger + state.thirst + state.rest) / 4)} emoji="❤️" />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* Warmth shows 10/10 when any active fire is present in the environment */}
          <BarStat label="Warmth" value={state.fire > 0 ? 10 : 0} emoji="🔥" />
          <BarStat label="Hunger" value={state.hunger} emoji="🍖" />
          <BarStat label="Thirst" value={state.thirst} emoji="💧" />
          <BarStat label="Rest" value={state.rest} emoji="💤" />
        </div>

        {/* Season and weather moved to Environment panel for clarity. */}
      </div>
    </section>
  );
}
function BarStat({ label, value, emoji }: { label: string; value: number; emoji?: string }) {
  const clamped = Math.max(0, Math.min(10, Math.round(value)));
  const pct = Math.round((clamped / 10) * 100);

  return (
    <div className="rounded bg-zinc-50 p-3 dark:bg-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-lg">{emoji}</span>
          <span className="font-medium">{label}</span>
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">{clamped}/10</div>
      </div>

      <div className="mt-2 w-full rounded bg-zinc-200 dark:bg-zinc-700" style={{ height: 10 }}>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={clamped}
          className="h-full rounded bg-amber-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
