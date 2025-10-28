"use client";

import React, { useState } from "react";
import type { Inventory } from "../hooks/useGame";

export default function FoodSelectionModal({
  open,
  onClose,
  inventory,
  hoursRemaining,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  inventory: Inventory;
  hoursRemaining: number;
  onConfirm: (foodType: "food" | "berries", qty: number) => void;
}) {
  const availableFood = inventory.food || 0;
  const availableBerries = inventory.berries || 0;

  // Initialize defaults once per mount; parent supplies a changing key to reset between opens
  const [selected, setSelected] = useState<"food" | "berries">(() => (availableFood > 0 ? "food" : availableBerries > 0 ? "berries" : "food"));
  const [qty, setQty] = useState<number>(() => (availableFood > 0 || availableBerries > 0 ? 1 : 0));

  if (!open) return null;

  const perItemHours = 1; // each eating action costs 1 hour per item
  const maxByHours = Math.max(0, Math.floor(hoursRemaining / perItemHours));

  const availableForSelected = selected === "food" ? availableFood : availableBerries;
  const maxQty = Math.max(0, Math.min(availableForSelected, maxByHours));
  const clampedQty = Math.max(0, Math.min(qty, maxQty));

  function confirm() {
    if (clampedQty <= 0) return;
    onConfirm(selected, clampedQty);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

      <div className="relative z-10 w-full max-w-md rounded bg-white p-4 shadow-lg dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Eat Food</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Choose what to eat and how much.</p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="food-type"
                value="food"
                checked={selected === "food"}
                onChange={() => setSelected("food")}
                disabled={availableFood <= 0}
              />
              <span className="font-medium">Meat</span>
            </label>
            <span className="text-sm text-zinc-500">({availableFood} available)</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="food-type"
                value="berries"
                checked={selected === "berries"}
                onChange={() => setSelected("berries")}
                disabled={availableBerries <= 0}
              />
              <span className="font-medium">Berries</span>
            </label>
            <span className="text-sm text-zinc-500">({availableBerries} available)</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                onClick={() => setQty((n) => Math.max(0, Math.min(maxQty, (n || 0) - 1)))}
                disabled={clampedQty <= 0}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                max={maxQty}
                value={clampedQty}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQty(Number.isFinite(val) ? Math.max(0, Math.min(maxQty, val)) : 0);
                }}
                className="w-20 rounded border px-2 py-1 text-sm"
              />
              <button
                type="button"
                className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                onClick={() => setQty((n) => Math.max(0, Math.min(maxQty, (n || 0) + 1)))}
                disabled={clampedQty >= maxQty}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <div className="text-sm text-zinc-500">Max: {maxQty} (hours left allow {maxByHours})</div>
          </div>

          <div className="text-sm">
            {clampedQty > 0 ? (
              <div>
                Eating {clampedQty} {selected} will restore {selected === "food" ? 3 * clampedQty : 2 * clampedQty} hunger and cost {perItemHours * clampedQty} hour{perItemHours * clampedQty > 1 ? "s" : ""}.
              </div>
            ) : (
              <div className="text-zinc-500">Select an amount to eat.</div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded border px-3 py-2 text-sm focus:outline-none"
            onClick={onClose}
            aria-label="Cancel eating"
          >
            Cancel
          </button>
          <button
            className="rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white focus:outline-none"
            onClick={confirm}
            disabled={clampedQty <= 0 || maxQty <= 0}
            aria-label="Confirm eating"
          >
            Eat
          </button>
        </div>
      </div>
    </div>
  );
}
