"use client";

import React from "react";
import type { GameState } from "../hooks/useGame";

export default function EnvironmentPanel({ state }: { state: GameState }) {
  const fire = state.fire || 0;

  return (
    <section aria-label="Environment" className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold">Environment</h3>

      {fire <= 0 ? (
        <div className="text-sm text-zinc-500">No active fire. Light one to warm yourself.</div>
      ) : (
        <div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span className="font-medium">Fire</span>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">{fire}/10</div>
          </div>

          <div className="mt-2 w-full rounded bg-zinc-200 dark:bg-zinc-700" style={{ height: 10 }}>
            <div className="h-full rounded bg-amber-500" style={{ width: `${Math.max(0, Math.min(10, Math.round(fire))) * 10}%` }} />
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
        {state.season ? (
          <div>{state.season === "spring" ? "🌱 Spring" : state.season === "summer" ? "☀️ Summer" : state.season === "autumn" ? "🍂 Autumn" : "❄️ Winter"}</div>
        ) : null}
        {state.weather ? (
          <div className="mt-1">{state.weather.type === "clear" ? "Clear" : state.weather.type === "rain" ? "Rain" : state.weather.type === "snow" ? "Snow" : "Cold snap"}{typeof state.weather.temp === "number" ? ` • ${state.weather.temp}°` : ""}</div>
        ) : null}
      </div>
    </section>
  );
}
