"use client";

import React from "react";
import type { Inventory } from "../hooks/useGame";

export default function InventoryPanel({ inventory }: { inventory: Inventory }) {
  return (
    <section aria-label="Inventory" className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold">Inventory</h3>
      <ul className="space-y-2" role="list">
        <li className="flex justify-between text-sm">
          <span>🪵 Wood</span>
          <span className="font-medium">{inventory.wood}</span>
        </li>
        <li className="flex justify-between text-sm">
          <span>🥩 Meat</span>
          <span className="font-medium">{inventory.meat}</span>
        </li>
        <li className="flex justify-between text-sm">
          <span>🫐 Berries</span>
          <span className="font-medium">{inventory.berries}</span>
        </li>
        <li className="flex justify-between text-sm">
          <span>🏺 Artifacts</span>
          <span className="font-medium">{inventory.artifacts}</span>
        </li>
      </ul>
    </section>
  );
}