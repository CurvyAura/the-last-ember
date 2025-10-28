"use client";

import React from "react";
import type { GameState } from "../hooks/useGame";

export default function StatsPanel({ state }: { state: GameState }) {
  return (
    <section aria-label="Player stats" className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold">Stats</h3>
      <ul className="flex flex-wrap gap-3" role="list">
        <li>
          <Stat label="Fire" value={state.fire} emoji="🔥" />
        </li>
        <li>
          <Stat label="Hunger" value={state.hunger} emoji="🍖" />
        </li>
        <li>
          <Stat label="Rest" value={state.rest} emoji="💤" />
        </li>
        <li>
          <Stat label="Days survived" value={state.daysSurvived} emoji="📅" />
        </li>
        <li>
          <Stat label="Hours left" value={state.hoursRemaining} emoji="⏰" />
        </li>
      </ul>
    </section>
  );
}

function Stat({ label, value, emoji }: { label: string; value: number; emoji?: string }) {
  return (
    <div className="flex items-baseline gap-2 rounded bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
      <span aria-hidden className="mr-1">
        {emoji}
      </span>
      <span className="font-medium">{label}</span>
      <span className="sr-only">:</span>
      <span className="ml-1 text-zinc-600 dark:text-zinc-300" aria-live="polite">{value}</span>
    </div>
  );
}
