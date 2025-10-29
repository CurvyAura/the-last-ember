import type { Storylet } from "../types";

export const INTERACTIVE: Storylet[] = [
  {
    id: "river:ice-crossing",
    tags: ["terrain", "hazard"],
    cooldownDays: 2,
    weight: (s) => (s.storyFlags["seen:any-interactive"] ? 1.2 : 3.0),
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void ctx; void rng;
      const hasExploration = !!(s.skills?.exploration);
      return {
        logs: ["A broad sheet of river lies ahead, skinned with thin ice."],
        // Mark that the player has encountered an interactive beat at least once this run
        flags: { "seen:any-interactive": true },
        prompt: {
          title: "Thin Ice",
          body: "Do you test the ice or find a longer way around?",
          options: [
            {
              label: "Test the ice",
              description: hasExploration ? "Your exploration skill should help." : "Risky without experience.",
              effect: (s2, _ctx2, _rng2) => {
                void _ctx2; void _rng2;
                const skilled = !!(s2.skills?.exploration);
                return skilled
                  ? { logs: ["You pick your path and cross, quick and clean. (+1 rest)"], delta: { rest: 1 } }
                  : { logs: ["The ice groans and you lurch to shore soaked to the shin. (-1 rest)"], delta: { rest: -1 } };
              },
            },
            {
              label: "Go around",
              description: "Slower, safer; you keep to solid ground.",
              effect: (_s3, _ctx3, _rng3) => { void _s3; void _ctx3; void _rng3; return ({ logs: ["You bushwhack along the bank until a safe ford. (no change)"] }); },
            },
          ],
        },
      };
    },
  },
  {
    id: "cairn:fork-choice",
    tags: ["signs", "terrain"],
    cooldownDays: 2,
    weight: (s) => (s.storyFlags["seen:any-interactive"] ? 1.0 : 2.5),
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void ctx; void rng;
      const hasExploration = !!(s.skills?.exploration);
      return {
        logs: ["A cairn marks a fork: one path winds low through brush, the other climbs exposed rock."],
        flags: { "seen:any-interactive": true },
        prompt: {
          title: "The Fork",
          body: "Which way do you go?",
          options: [
            {
              label: "Low through the brush",
              description: "Sheltered but tangled.",
              effect: (_s2, _c2, _r2) => { void _s2; void _c2; void _r2; return { logs: ["Twigs snag your clothes but the wind drops. (+1 rest)"], delta: { rest: 1 } }; },
            },
            {
              label: "Up over the rock",
              description: hasExploration ? "You pick good footing." : "Could be slick.",
              effect: (s3, _c3, _r3) => { void _c3; void _r3; return !!(s3.skills?.exploration)
                ? { logs: ["You make quick time on firm stone. (+1 rest)"], delta: { rest: 1 } }
                : { logs: ["A boot skids and you bang a knee. (-1 rest)"], delta: { rest: -1 } }; },
            },
          ],
        },
      };
    },
  },
  {
    id: "pack:abandoned",
    tags: ["find"],
    cooldownDays: 3,
    weight: (s) => (s.storyFlags["seen:any-interactive"] ? 1.0 : 2.2),
    when: (_s, ctx) => ctx.action === "explore",
    effect: (_s, ctx, rng) => {
      void ctx; void rng;
      return {
        logs: ["Half-buried under snow: an old pack with a broken strap."],
        flags: { "seen:any-interactive": true },
        prompt: {
          title: "Abandoned Pack",
          body: "Search it quickly or carefully?",
          options: [
            {
              label: "Quick search",
              description: "Faster, sloppier—take what you spot.",
              effect: (_s2, _c2, r2) => { void _s2; void _c2; const hit = r2.int(1, 3) === 1; return hit
                ? { logs: ["You grab a wrapped bundle. Dried meat, somehow still good. (+1 meat)"], delta: { inventory: { meat: 1 } } }
                : { logs: ["Empty tins and a torn blanket. (no change)"] };
              },
            },
            {
              label: "Careful search",
              description: "Slower, thorough—less chance to miss something.",
              effect: (_s3, _c3, r3) => { void _s3; void _c3; const hit = r3.int(1, 2) === 1; return hit
                ? { logs: ["At the bottom, a tin of berries syrupy and sweet. (+1 berries)"], delta: { inventory: { berries: 1 } } }
                : { logs: ["Mildew and mold. You leave it be. (no change)"] };
              },
            },
          ],
        },
      };
    },
  },
];
