"use client";

import type { ActionContext, GameView, RiskLevel, StoryResult, Storylet } from "./types";
import { createRNG } from "./rng";
import { STORYLETS } from "./storylets/index";

export type EngineOptions = {
  risk: RiskLevel;
};

const DEFAULT_OPTS: EngineOptions = { risk: "moderate" };

export function makeEngine(seed: number, opts: Partial<EngineOptions> = {}) {
  const options: EngineOptions = { ...DEFAULT_OPTS, ...opts } as EngineOptions;
  const rng = createRNG(seed || 123456789);

  function eligible(s: GameView, ctx: ActionContext, lette: Storylet): boolean {
    // respect cooldowns
    const lockUntil = s.storyCooldowns[lette.id];
    if (typeof lockUntil === "number" && ctx.day < lockUntil) return false;
    // respect once per run
    if (lette.oncePerRun && s.storyFlags[`seen:${lette.id}`]) return false;
    return lette.when(s, ctx);
  }

  function weightOf(s: GameView, ctx: ActionContext, lette: Storylet): number {
    let w = typeof lette.weight === "function" ? lette.weight(s, ctx) : (lette.weight ?? 1);
    const tags = lette.tags || [];
    // Tag-based bias: surface more "interesting" outcomes (find/boon/wildlife), tone down signs/lore/hazard a bit
    const has = (t: string) => tags.includes(t);
    if (has("find")) w *= 1.4;
    if (has("boon")) w *= 1.25;
    if (has("wildlife")) w *= 1.15;
    if (has("hazard")) w *= 0.9;
    if (has("signs")) w *= 0.85;
    if (has("lore")) w *= 0.9;
    // Mild day-based ramp so runs feel more eventful after Day 2
    if (ctx.day >= 2) w *= 1.1;
    return Math.max(0, w);
  }

  function pickWeighted<T>(items: T[], getW: (t: T) => number): T | null {
    let total = 0;
    const weights = items.map((it) => {
      const w = getW(it);
      total += w;
      return w;
    });
    if (total <= 0) return null;
    let r = rng.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1] ?? null;
  }

  function generateStoryBeat(s: GameView, ctx: ActionContext): StoryResult | null {
    const pool: Storylet[] = STORYLETS.filter((sl: Storylet) => eligible(s, ctx, sl));
    if (pool.length === 0) return null;
    const chosen = pickWeighted(pool, (sl: Storylet) => weightOf(s, ctx, sl));
    if (!chosen) return null;
    const res = chosen.effect(s, ctx, rng);
    // Attach defaults from storylet
    if (res.cooldownDays == null && chosen.cooldownDays != null) res.cooldownDays = chosen.cooldownDays;
    return { ...res, id: chosen.id };
  }

  function generateFlavor(s: GameView, ctx: ActionContext): string | null {
    // very light flavor lines per action
    const base: Record<string, string[]> = {
      gather: [
        "You pick splinters from your palms.",
        "Old branches snap in the cold.",
      ],
      hunt: [
        "A crow watches from a blackened stump.",
        "Your breath ghosts over the track.",
      ],
      rest: [
        "Sleep comes in thin, ragged sheets.",
        "You curl closer to the ember's glow.",
      ],
      tend: [
        "Resin pops; sparks twist upward.",
        "Smoke clings to your clothes.",
      ],
      eat: [
        "Warmth spreads as you swallow.",
        "It isn't much, but it steadies you.",
      ],
      offer: [
        "For a moment the ember draws breath.",
        "Ash eddies, then settles.",
      ],
      explore: [],
    };
    const lines = base[ctx.action] || [];
    if (lines.length === 0) return null;
    // 1-in-3 chance to emit flavor on non-explore
    if (ctx.action === "explore") return null;
    if (rng.int(1, 3) !== 1) return null;
    return lines[rng.int(0, lines.length - 1)] ?? null;
  }

  return { rng, options, generateStoryBeat, generateFlavor } as const;
}

export function applyStoryResult(s: GameView, ctx: ActionContext, res: StoryResult): {
  nextFlags: Record<string, boolean | number>;
  nextCooldowns: Record<string, number>;
  logs: string[];
  delta: Required<Pick<StoryResult, "delta">>["delta"];
} {
  const logs = res.logs || [];
  const nextFlags = { ...s.storyFlags, [`seen:${res.id}`]: true, ...(res.flags || {}) };
  const nextCooldowns = { ...s.storyCooldowns };
  if (res.id && typeof res.cooldownDays === "number" && res.cooldownDays > 0) {
    nextCooldowns[res.id] = ctx.day + res.cooldownDays;
  }
  const delta = res.delta || {};
  return { nextFlags, nextCooldowns, logs, delta };
}

export { STORYLETS };
