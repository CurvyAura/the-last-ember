"use client";

import React from "react";

export type ChoiceModalProps = {
  open: boolean;
  title?: string;
  body?: string;
  options: Array<{ label: string; description?: string }>;
  onSelect: (index: number) => void;
  onClose: () => void;
};

export default function ChoiceModal({ open, title, body, options, onSelect, onClose }: ChoiceModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div role="dialog" aria-modal className="relative w-full max-w-md rounded border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">{title || "Choose"}</h2>
        {body ? <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{body}</p> : null}
        <div className="mt-4 space-y-2">
          {options.map((opt, idx) => (
            <button
              key={idx}
              className="w-full rounded bg-zinc-800 px-3 py-2 text-left text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              onClick={() => onSelect(idx)}
            >
              <div className="flex flex-col">
                <span>{opt.label}</span>
                {opt.description ? <span className="text-xs font-normal opacity-75">{opt.description}</span> : null}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded px-3 py-2 text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
