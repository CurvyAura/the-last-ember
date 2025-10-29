"use client";

import React, { useState } from "react";
import { useGame } from "../hooks/useGame";
import StatsPanel from "@/components/StatsPanel";
import LogPanel from "@/components/LogPanel";
import ActionButtons from "@/components/ActionButtons";
import type { ActionType } from "@/components/ActionButtons";
import PostRunModal from "@/components/PostRunModal";
import InventoryPanel from "@/components/InventoryPanel";
import FoodSelectionModal from "@/components/FoodSelectionModal";

export default function Home() {
  const game = useGame();
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans p-4">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:px-2 focus:py-1 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Skip to main content
      </a>
      <main id="main-content" className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">The Last Ember</h1>
          <a className="text-sm underline" href="/knowledge">
            Knowledge Tree
          </a>
        </header>

        <section className="grid gap-4">
          {/* Order: Log -> Buttons -> Stats -> Inventory */}

          <div>
            <LogPanel log={game.state.log} />
          </div>

          <div className="flex flex-col items-stretch">
            <ActionButtons
              onAction={(a: ActionType) => {
                if (a === "eat") {
                  const inv = game.state.inventory;
                  if ((inv.food || 0) > 0 || (inv.berries || 0) > 0) {
                    setModalKey((k) => k + 1);
                    setShowFoodModal(true);
                  } else {
                    game.performAction(a);
                  }
                } else {
                  game.performAction(a);
                }
              }}
              disabled={!game.state.isRunning}
              hoursRemaining={game.state.hoursRemaining}
              canEat={(game.state.inventory.food || 0) > 0 || (game.state.inventory.berries || 0) > 0}
            />

            <div className="mt-4">
              <button
                className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
                onClick={game.endDay}
                disabled={!game.state.isRunning}
                aria-label="End current day"
              >
                End Day ({game.state.hoursRemaining}h remaining)
              </button>
            </div>
          </div>

          <div>
            <StatsPanel state={game.state} />
          </div>

          <div>
            <InventoryPanel inventory={game.state.inventory} />
          </div>
        </section>

        <PostRunModal open={!game.state.isRunning && game.state.xp > 0} xp={game.state.xp} onSpend={game.unlockSkill} onReset={() => game.resetRun()} unlocked={game.state.skills} />
        <FoodSelectionModal
          key={modalKey}
          open={showFoodModal}
          onClose={() => setShowFoodModal(false)}
          inventory={game.state.inventory}
          hoursRemaining={game.state.hoursRemaining}
          onConfirm={(foodType, qty) => {
            // call hook API
            // eatFood is available on the hook return; cast to any for safety in TS inference
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            game.eatFood(foodType, qty);
          }}
        />
      </main>
    </div>
  );
}
