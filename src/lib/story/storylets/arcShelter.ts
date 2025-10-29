import type { Storylet, StoryResult } from "../types";

// Simple 3-step arc toward a makeshift shelter
// Steps gate by day offsets and flags; reward is modest and survival-appropriate

export const ARC_SHELTER: Storylet[] = [
  {
    id: "arc:shelter:trace",
    tags: ["arc","signs"],
    oncePerRun: true,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void _rng;
      const day = ctx.day;
      const logs = [
        "A scuffed bootprint in thawing mud. Someone passed this way before the burn.",
      ];
      const flags: Record<string, number> = { "arc:shelter:trace:day": day };
      return { logs, flags } as StoryResult;
    },
  },
  {
    id: "arc:shelter:marker",
    tags: ["arc","signs"],
    oncePerRun: true,
    weight: 0.9,
    when: (s, ctx) => {
      if (ctx.action !== "explore") return false;
      const seenDay = Number(s.storyFlags["arc:shelter:trace:day"]) || -1;
      if (seenDay < 0) return false;
      return ctx.day >= seenDay + 1;
    },
    effect: (s, ctx, _rng) => {
      void s; void _rng;
      const logs = [
        "A crumbling trail marker leans in the ash. Someone tried to point the way.",
      ];
      const flags: Record<string, number> = { "arc:shelter:marker:day": ctx.day };
      return { logs, flags };
    },
  },
  {
    id: "arc:shelter:lean-to",
    tags: ["arc","find"],
    oncePerRun: true,
    cooldownDays: 3,
    weight: 0.8,
    when: (s, ctx) => {
      if (ctx.action !== "explore") return false;
      const mday = Number(s.storyFlags["arc:shelter:marker:day"]) || -1;
      if (mday < 0) return false;
      return ctx.day >= mday + 1;
    },
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const gotArtifact = rng.int(1, 5) === 1; // 20%
      const logs = gotArtifact
        ? [
            "Half-collapsed lean-to under a black spruce. You salvage a small token from the wreck. (+1 artifact)",
          ]
        : [
            "Half-collapsed lean-to under a black spruce. You brace a windbreak and catch your breath. (+1 rest)",
          ];
      return gotArtifact
        ? { logs, delta: { inventory: { artifacts: 1 } } }
        : { logs, delta: { rest: 1 } };
    },
  },
];
