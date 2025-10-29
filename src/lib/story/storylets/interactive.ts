import type { Storylet } from "../types";

export const INTERACTIVE: Storylet[] = [
  {
    id: "river:ice-crossing",
    tags: ["terrain", "hazard"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void ctx; void rng;
      const hasExploration = !!(s.skills?.exploration);
      return {
        logs: ["A broad sheet of river lies ahead, skinned with thin ice."],
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
];
