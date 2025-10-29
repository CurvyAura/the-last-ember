"use client";

import React from "react";
import { useState } from "react";
import Link from "next/link";
import type { Skills } from "../../hooks/useGame";

function loadSkills(): Skills {
  try {
    const raw = typeof window !== "undefined" && localStorage.getItem("tle-knowledge");
    if (!raw) return { fireMastery: false, hunting: false, exploration: false };
    return JSON.parse(raw);
  } catch {
    return { fireMastery: false, hunting: false, exploration: false };
  }
}

export default function KnowledgePage() {
  const [skills, setSkills] = useState<Skills>({ fireMastery: false, hunting: false, exploration: false });

  // load persisted skills on client mount to avoid hydration mismatch
  React.useEffect(() => {
    setSkills(loadSkills());
  }, []);

  function saveSkills(next: Skills) {
    try {
      localStorage.setItem("tle-knowledge", JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function setSkill<K extends keyof Skills>(key: K, value: boolean) {
    setSkills((prev) => {
      const next = { ...prev, [key]: value } as Skills;
      saveSkills(next);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 dark:bg-black">
      <main className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Knowledge Tree</h1>
          <Link className="text-sm underline" href="/">
            Back to Game
          </Link>
        </header>

        <div className="space-y-3 rounded bg-white p-4 dark:bg-zinc-900">
          <SkillCard
            title="Fire Mastery"
            unlocked={skills.fireMastery}
            description="Fire decays slower each turn."
            onEnable={() => setSkill("fireMastery", true)}
            onDisable={() => setSkill("fireMastery", false)}
          />
          <SkillCard
            title="Hunting"
            unlocked={skills.hunting}
            description="Higher hunt success and more food from hunts."
            onEnable={() => setSkill("hunting", true)}
            onDisable={() => setSkill("hunting", false)}
          />
          <SkillCard
            title="Exploration"
            unlocked={skills.exploration}
            description="Find more positive random events while exploring."
            onEnable={() => setSkill("exploration", true)}
            onDisable={() => setSkill("exploration", false)}
          />
        </div>
      </main>
    </div>
  );
}

function SkillCard({ title, unlocked, description, onEnable, onDisable }: { title: string; unlocked: boolean; description: string; onEnable: () => void; onDisable: () => void }) {
  return (
    <div className="flex items-center justify-between rounded border border-zinc-100 p-3 dark:border-zinc-700">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-zinc-500">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${unlocked ? "text-emerald-600" : "text-zinc-500"}`}>
          {unlocked ? "Unlocked" : "Locked"}
        </span>
        <button
          className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
          onClick={onEnable}
          disabled={unlocked}
          aria-label={`Enable ${title}`}
        >
          Enable
        </button>
        <button
          className="rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
          onClick={onDisable}
          disabled={!unlocked}
          aria-label={`Disable ${title}`}
        >
          Disable
        </button>
      </div>
    </div>
  );
}
