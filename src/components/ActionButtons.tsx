"use client";

import React from "react";

export type ActionType = "gather" | "hunt" | "rest" | "explore" | "tend" | "eat" | "drink";

export default function ActionButtons({
  onAction,
  disabled,
  hoursRemaining,
  canEat = true,
  canDrink = true,
}: {
  onAction: (a: ActionType) => void;
  disabled?: boolean;
  hoursRemaining: number;
  canEat?: boolean;
  canDrink?: boolean;
  canOffer?: boolean;
}) {
  const hourCosts = {
    gather: 4,
    hunt: 6,
    rest: 8,
    explore: 5,
    tend: 2,
    eat: 1,
    drink: 1,
    offer: 1,
  };

  const canAfford = (action: ActionType) => hoursRemaining >= hourCosts[action];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Actions">
      <button
        className="rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
        onClick={() => onAction("gather")}
        disabled={disabled || !canAfford("gather")}
        aria-label="Gather wood"
      >
        Gather Wood ({hourCosts.gather}h)
      </button>
      <button
        className="rounded bg-stone-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-400"
        onClick={() => onAction("tend")}
        disabled={disabled || !canAfford("tend")}
        aria-label="Tend the fire"
      >
        Tend Fire ({hourCosts.tend}h)
      </button>
      <button
        className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
        onClick={() => onAction("hunt")}
        disabled={disabled || !canAfford("hunt")}
        aria-label="Hunt for food"
      >
        Hunt ({hourCosts.hunt}h)
      </button>
      <button
        className="rounded bg-orange-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
        onClick={() => onAction("eat")}
        disabled={disabled || !canAfford("eat") || !canEat}
        aria-label="Eat food from inventory"
      >
        Eat ({hourCosts.eat}h)
      </button>
      <button
        className="rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400"
        onClick={() => onAction("drink")}
        disabled={disabled || !canAfford("drink") || !canDrink}
        aria-label="Drink to restore thirst"
      >
        Drink ({hourCosts.drink}h)
      </button>
      {/* <button
        className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
        onClick={() => onAction("offer")}
        disabled={disabled || !canAfford("offer") || !canOffer}
        aria-label="Offer an artifact to the ember"
      >
        Offer to the Ember ({hourCosts.offer}h)
      </button> */}
      <button
        className="rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400"
        onClick={() => onAction("rest")}
        disabled={disabled || !canAfford("rest")}
        aria-label="Rest to recover"
      >
        Rest ({hourCosts.rest}h)
      </button>
      <button
        className="rounded bg-violet-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400"
        onClick={() => onAction("explore")}
        disabled={disabled || !canAfford("explore")}
        aria-label="Explore the surroundings"
      >
        Explore ({hourCosts.explore}h)
      </button>
    </div>
  );
}
