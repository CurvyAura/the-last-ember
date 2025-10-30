"use client";

import React from "react";
import type { Inventory } from "../hooks/useGame";

// Local weight table for UI load calculation (kept in sync with game logic)
const ITEM_WEIGHTS: Record<string, number> = {
  wood: 1,
  meat: 2,
  berries: 0.5,
  idol: 5,
  shard: 3,
  heart: 4,
  feather: 1,
  artifacts: 3,
};

function computeLoad(inv: Inventory) {
  const t = inv.artifactsByType || { idol: 0, shard: 0, heart: 0, feather: 0 };
  let load = 0;
  load += (inv.wood || 0) * ITEM_WEIGHTS.wood;
  load += (inv.meat || 0) * ITEM_WEIGHTS.meat;
  load += (inv.berries || 0) * ITEM_WEIGHTS.berries;
  if (inv.artifactsByType) {
    load += (t.idol || 0) * ITEM_WEIGHTS.idol;
    load += (t.shard || 0) * ITEM_WEIGHTS.shard;
    load += (t.heart || 0) * ITEM_WEIGHTS.heart;
    load += (t.feather || 0) * ITEM_WEIGHTS.feather;
  } else {
    load += (inv.artifacts || 0) * ITEM_WEIGHTS.artifacts;
  }
  return load;
}

export default function InventoryPanel({ inventory, carryCapacity = 0 }: { inventory: Inventory; carryCapacity?: number }) {
  const load = computeLoad(inventory);

  // Build a list of visible items (only those with a positive count)
  const items: Array<{ key: string; label: string; value: number | string }> = [];
  if ((inventory.wood || 0) > 0) items.push({ key: "wood", label: "🪵 Wood", value: inventory.wood });
  if ((inventory.meat || 0) > 0) items.push({ key: "meat", label: "🥩 Meat", value: inventory.meat });
  if ((inventory.berries || 0) > 0) items.push({ key: "berries", label: "🫐 Berries", value: inventory.berries });
  if ((inventory.artifacts || 0) > 0) items.push({ key: "artifacts", label: "🏺 Artifacts", value: inventory.artifacts });

  return (
    <section aria-label="Inventory" className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Inventory</h3>
        <div className="text-xs text-zinc-500">Load: <span className="font-medium">{load}</span>/<span className="font-medium">{carryCapacity}</span></div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-zinc-500">You carry nothing.</div>
      ) : (
        <ul className="space-y-2" role="list">
          {items.map((it) => (
            <li key={it.key} className="flex justify-between text-sm">
              <span>{it.label}</span>
              <span className="font-medium">{it.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}