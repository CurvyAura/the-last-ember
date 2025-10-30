"use client";

import React, { useState } from "react";
import { useGame } from "../hooks/useGame";
import StatsPanel from "@/components/StatsPanel";
import LogPanel from "@/components/LogPanel";
import ActionButtons from "@/components/ActionButtons";
import EnvironmentPanel from "@/components/EnvironmentPanel";
import type { ActionType } from "@/components/ActionButtons";
import PostRunModal from "@/components/PostRunModal";
import InventoryPanel from "@/components/InventoryPanel";
import FoodSelectionModal from "@/components/FoodSelectionModal";
import ChoiceModal from "@/components/ChoiceModal";
// Offer mechanic hidden in survival pivot

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
          <div>
            <h1 className="text-2xl font-semibold">The Last Ember</h1>
            {/* <p className="text-xs text-zinc-600 dark:text-zinc-400">Quick tips: gather wood, tend the fire, eat to recover, and rest to regain strength.</p> */}
          </div>
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
                  if ((inv.meat || 0) > 0 || (inv.berries || 0) > 0) {
                    setModalKey((k) => k + 1);
                    setShowFoodModal(true);
                  } else {
                    game.performAction(a);
                  }
                } else {
                  // offer/action meta removed from main loop; other actions pass through
                  game.performAction(a);
                }
              }}
              disabled={!game.state.isRunning || !!game.state.currentPrompt}
              hoursRemaining={game.state.hoursRemaining}
              canEat={(game.state.inventory.meat || 0) > 0 || (game.state.inventory.berries || 0) > 0}
              canDrink={game.state.thirst < 10}
              canOffer={false}
            />

            <div className="mt-4">
              <button
                className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
                onClick={game.endDay}
                disabled={!game.state.isRunning || !!game.state.currentPrompt}
                aria-label="End current day"
              >
                End Day ({game.state.hoursRemaining}h remaining)
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <StatsPanel state={game.state} />
            </div>

            <div>
              <EnvironmentPanel state={game.state} />
            </div>

            <div className="sm:col-span-2">
              <InventoryPanel inventory={game.state.inventory} carryCapacity={game.state.carryCapacity} />
            </div>
          </div>
        </section>

  <PostRunModal open={!game.state.isRunning} onReset={() => game.resetRun()} recentLog={game.state.log.slice(-3)} daysSurvived={game.state.daysSurvived} />
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
        <ChoiceModal
          open={!!game.state.currentPrompt}
          title={game.state.currentPrompt?.title}
          body={game.state.currentPrompt?.body}
          options={(game.state.currentPrompt?.options || []).map((o) => ({ label: o.label, description: o.description }))}
          onSelect={(idx) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            game.respondToPrompt(idx);
          }}
          onClose={() => {
            // For now, closing without choosing leaves the prompt; user must choose to proceed
          }}
        />

        {/* Offer UI removed in survival pivot */}
      </main>
    </div>
  );
}
