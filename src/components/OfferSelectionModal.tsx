"use client";

import React, { useMemo } from "react";
import type { Inventory } from "../hooks/useGame";

type ArtifactType = "idol" | "shard" | "heart" | "feather";

export default function OfferSelectionModal({
  open,
  onClose,
  inventory,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  inventory: Inventory;
  onConfirm: (type: ArtifactType) => void;
}) {
  const counts = inventory.artifactsByType || { idol: 0, shard: 0, heart: 0, feather: 0 };
  const countsRec: Record<ArtifactType, number> = counts as Record<ArtifactType, number>;
  const options = useMemo(
    () => [
      { key: "idol" as const, label: "Ancient Idol", desc: "A small idol of gold and coal." },
      { key: "shard" as const, label: "Blackened Shard", desc: "A shard that drinks the light." },
      { key: "heart" as const, label: "Heart of Ice", desc: "A cold core that will not melt." },
      { key: "feather" as const, label: "Silver Feather", desc: "Weightless, it cuts the wind." },
    ],
    []
  );

  if (!open) return null;

  const hasAny = (counts.idol || 0) + (counts.shard || 0) + (counts.heart || 0) + (counts.feather || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

      <div className="relative z-10 w-full max-w-md rounded bg-white p-4 shadow-lg dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Offer to the Ember</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Choose a relic to offer. The ember will remember.</p>

        <div className="mt-4 space-y-3">
          {options.map((opt) => (
            <div key={opt.key} className="flex items-center justify-between rounded border border-zinc-200 p-3 dark:border-zinc-700">
              <div>
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-zinc-500">{opt.desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">({countsRec[opt.key] || 0})</span>
                <button
                  className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                  onClick={() => onConfirm(opt.key)}
                  disabled={(countsRec[opt.key] || 0) <= 0}
                  aria-label={`Offer ${opt.label}`}
                >
                  Offer
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button className="rounded border px-3 py-2 text-sm" onClick={onClose} aria-label="Close offer modal">
            Close
          </button>
        </div>

        {!hasAny && <div className="mt-2 text-xs text-zinc-500">You have no relics to offer.</div>}
      </div>
    </div>
  );
}
