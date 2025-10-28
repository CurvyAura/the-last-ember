"use client";

import React from "react";
import { useGame } from "../hooks/useGame";
import StatsPanel from "../components/StatsPanel";
import LogPanel from "../components/LogPanel";
import ActionButtons from "../components/ActionButtons";
import PostRunModal from "../components/PostRunModal";
import InventoryPanel from "../components/InventoryPanel";

export default function Home() {
  const game = useGame();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans p-4">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:px-2 focus:py-1 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Skip to main content
      </a>
      <main id="main-content" className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">The Last Ember — Text MVP</h1>
          <a className="text-sm underline" href="/knowledge">
            Knowledge Tree
          </a>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <StatsPanel state={game.state} />
            <div className="mt-4">
              <InventoryPanel inventory={game.state.inventory} />
            </div>
            <div className="mt-4">
              <ActionButtons 
                onAction={game.performAction} 
                disabled={!game.state.isRunning} 
                hoursRemaining={game.state.hoursRemaining} 
              />
            </div>
            <div className="mt-4">
              <button
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
                onClick={game.endDay}
                disabled={!game.state.isRunning}
                aria-label="End current day"
              >
                End Day ({game.state.hoursRemaining}h remaining)
              </button>
            </div>
          </div>

          <aside className="order-first sm:order-last">
            <LogPanel log={game.state.log} />
          </aside>
        </section>

        <footer className="text-sm text-zinc-600 dark:text-zinc-400">
          Days survived: {game.state.daysSurvived}
        </footer>

        <PostRunModal open={!game.state.isRunning && game.state.xp > 0} xp={game.state.xp} onSpend={game.unlockSkill} onReset={() => game.resetRun()} unlocked={game.state.skills} />
      </main>
    </div>
  );
}
