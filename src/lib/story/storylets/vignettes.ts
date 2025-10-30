import type { Storylet, GameView } from "../types";

// Helper for small bounded negative effects depending on current bars
function mildHazardDelta(s: GameView, which: "rest" | "hunger") {
  const delta = which === "rest" ? { rest: -1 as number } : { hunger: -1 as number };
  return { delta };
}

export const VIGNETTES: Storylet[] = [
  {
    id: "weather:cutting-wind",
    tags: ["weather"],
    cooldownDays: 1,
    weight: (s) => (s.daysSurvived >= 2 ? 1.2 : 0.8),
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, _ctx, _rng) => {
      void s; void _ctx; void _rng;
      return {
        logs: ["A cutting wind scours the ridge. You push on, jaw clenched. (-1 rest)"],
        ...mildHazardDelta(s, "rest"),
      };
    },
  },
  {
    id: "wildlife:hare-bolt",
    tags: ["wildlife", "forage"],
    cooldownDays: 1,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const caught = rng.int(1, 5) <= 2; // 40% chance
      return {
        logs: caught
          ? ["A hare bolts from cover. You get lucky with a thrown stone. (+1 meat)"]
          : ["A hare bolts from cover. Too quick to catch."],
        delta: caught ? { inventory: { meat: 1 } } : undefined,
      };
    },
  },
  {
    id: "river:thin-ice",
    tags: ["hazard", "weather"],
    cooldownDays: 3,
    weight: 0.9,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["A skin of ice gives beneath your boot; water soaks the cuff. You shiver. (-1 rest)"],
        delta: { rest: -1 },
      };
    },
  },
  {
    id: "river:driftwood",
    tags: ["find"],
    cooldownDays: 2,
  weight: 1.2,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["You pry up a length of driftwood from the bank. (+1 wood)"],
        delta: { inventory: { wood: 1 }, wood: 1 },
      };
    },
  },
  {
    id: "sky:aurora-faint",
    tags: ["weather", "boon"],
    cooldownDays: 3,
    weight: (s) => (s.daysSurvived >= 2 ? 0.9 : 0.6),
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["For a breath the sky ripples green and pale. It steadies you. (+1 rest)"],
        delta: { rest: 1 },
      };
    },
  },
  {
    id: "memory:old-camp",
    tags: ["lore", "boon"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const take = rng.int(0, 1) === 1;
      return {
        logs: take
          ? ["An old ring of stones. You scrape a bit of charred tinder free. (+1 wood)"]
          : ["An old ring of stones. Whoever camped here moved on long ago."],
        delta: take ? { inventory: { wood: 1 }, wood: 1 } : undefined,
      };
    },
  },
  {
    id: "cache:rusted-snare",
    tags: ["find", "wildlife"],
    cooldownDays: 3,
    weight: 0.8,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const full = rng.int(1, 2) === 1; // 50%
      return {
        logs: full
          ? ["A rusted snare someone left. A small catch hangs stiff. (+1 meat)"]
          : ["A rusted snare someone left. Empty now."],
        delta: full ? { inventory: { meat: 1 } } : undefined,
      };
    },
  },
  {
    id: "forage:frosted-berries",
    tags: ["forage"],
    cooldownDays: 1,
  weight: 1.3,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const n = rng.int(1, 2);
      return {
        logs: [n === 1 ? "You shake loose a few frosted berries. (+1 berries)" : "A low thicket yields more than you expected. (+2 berries)"],
        delta: { inventory: { berries: n } },
      };
    },
  },
  {
    id: "terrain:bog-slog",
    tags: ["hazard", "fatigue"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["Boot-sucking bog slows you to a crawl. (-1 rest)"],
        delta: { rest: -1 },
      };
    },
  },
  {
    id: "trail:cairn",
    tags: ["signs"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["A small cairn stacked with care. No direction, just proof of hands."],
      };
    },
  },
  {
    id: "artifact:charred-charm",
    tags: ["lore", "find"],
    cooldownDays: 999,
    oncePerRun: true,
  weight: 0.6,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["Under ash you find a charred charm on a leather cord. It hums faintly. (+1 artifact)"],
        delta: { inventory: { artifacts: 1 } },
      };
    },
  },
  {
    id: "frost:numb-fingers",
    tags: ["hazard"],
    cooldownDays: 1,
    weight: 1.1,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["You can’t feel your fingertips for a while. Everything takes longer. (-1 rest)"],
        delta: { rest: -1 },
      };
    },
  },
  {
    id: "hunger:pangs",
    tags: ["fatigue"],
    cooldownDays: 1,
    weight: 0.9,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["Hunger gnaws and your thoughts blur. (-1 hunger)"],
        delta: { hunger: -1 },
      };
    },
  },
  {
    id: "burrow:windbreak",
    tags: ["boon"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["You crouch behind a root-torn burrow and steal a quiet minute. (+1 rest)"],
        delta: { rest: 1 },
      };
    },
  },
  {
    id: "weather:freezing-fog",
    tags: ["hazard", "weather"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["A freezing fog crawls uphill. Every breath burns. (-1 rest)"],
        delta: { rest: -1 },
      };
    },
  },
  {
    id: "signs:scorched-bones",
    tags: ["lore", "signs"],
    cooldownDays: 3,
    weight: 0.7,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["In a hollow you find scorched bones and melted glass."],
      };
    },
  },
  {
    id: "tracks:heavy-paw",
    tags: ["signs", "wildlife"],
    cooldownDays: 2,
    weight: 0.8,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["Oversized paw prints scallop the drift beside your path."],
      };
    },
  },
  {
    id: "find:tinder-fungus",
    tags: ["find"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const help = rng.int(1, 3) === 1;
      return {
        logs: [help ? "A bracket of tinder fungus—dry and stubborn. (+1 wood)" : "A shelf fungus crumbles at your touch."],
        delta: help ? { inventory: { wood: 1 }, wood: 1 } : undefined,
      };
    },
  },
  {
    id: "sound:glass-chime",
    tags: ["lore"],
    cooldownDays: 3,
    weight: 0.6,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["Somewhere ahead, a faint clinking like glass in wind."] };
    },
  },
  {
    id: "storm:sleet",
    tags: ["weather", "hazard"],
    cooldownDays: 2,
    weight: 1.1,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["Sleet needles your face raw. (-1 rest)"], delta: { rest: -1 } };
    },
  },
  {
    id: "valley:thermal-pocket",
    tags: ["boon", "weather"],
    cooldownDays: 3,
    weight: 0.9,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["In a lee of rock, still air holds a bit of warmth. (+1 rest)"], delta: { rest: 1 } };
    },
  },
  {
    id: "thorn:scratch",
    tags: ["hazard"],
    cooldownDays: 1,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["A thorn rakes your wrist; it stings and slows you. (-1 rest)"], delta: { rest: -1 } };
    },
  },
  {
    id: "resin:pocket",
    tags: ["find"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const n = rng.int(1, 2);
      return {
        logs: [n === 1 ? "Sticky resin beads under a split. You pry some free. (+1 wood)" : "A wind-broken limb oozes resin; you scrape a bit. (+1 wood)"],
        delta: { inventory: { wood: 1 }, wood: 1 },
      };
    },
  },
  {
    id: "creek:trapped-fish",
    tags: ["find", "wildlife"],
    cooldownDays: 3,
    weight: 0.7,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const get = rng.int(1, 20) <= 9; // ~45%
      return {
        logs: [get ? "A fish is trapped in a shrinking pool between stones. You take it. (+1 meat)" : "A shrinking pool swirls with darting shadows—too quick."],
        delta: get ? { inventory: { meat: 1 } } : undefined,
      };
    },
  },
  {
    id: "wildlife:wolf-howl",
    tags: ["wildlife", "signs"],
    cooldownDays: 2,
    weight: 0.8,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["A distant howl wavers and fades. You are not alone out here."] };
    },
  },
  {
    id: "ash:soot-fall",
    tags: ["find", "forage"],
    cooldownDays: 3,
    weight: 0.8,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: [
          "You pry apart a rotten log and find a cluster of parched roots — bitter but filling. (+1 berries)",
        ],
        delta: { inventory: { berries: 1 } },
      };
    },
  },
  {
    id: "ember:carry",
    tags: ["boon"],
    cooldownDays: 3,
    weight: 0.6,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const good = rng.int(1, 4) === 1;
      return {
        logs: [good ? "You find dry bark that will take a coal cleanly. (+1 wood)" : "You pocket a curl of birch bark just in case."],
        delta: good ? { inventory: { wood: 1 }, wood: 1 } : undefined,
      };
    },
  },
  {
    id: "ridge:cut-bank",
    tags: ["terrain"],
    cooldownDays: 2,
    weight: 0.9,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["The trail pinches along a cut bank. You move slow and careful." ] };
    },
  },
  {
    id: "echo:woodpecker",
    tags: ["wildlife"],
    cooldownDays: 1,
    weight: 1.2,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["A woodpecker’s tapping keeps time with your steps."] };
    },
  },
  {
    id: "shade:evergreen",
    tags: ["boon", "weather"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["You pause under a heavy evergreen bough, sheltered from the wind. (+1 rest)"], delta: { rest: 1 } };
    },
  },
  {
    id: "snow:crust",
    tags: ["hazard", "terrain"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const bad = rng.int(1, 2) === 1;
      return { logs: [bad ? "You break through a crust and jar your knees. (-1 rest)" : "Each step crunches loud on the crusted snow."], delta: bad ? { rest: -1 } : undefined };
    },
  },
  {
    id: "glint:glass",
    tags: ["lore", "find"],
    cooldownDays: 3,
    weight: 0.7,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const rare = rng.int(1, 5) === 1; // 20%
      return {
        logs: [rare ? "A shard of bottle glass, edges melted smooth. You keep it. (+1 artifact)" : "A shard of bottle glass, edges melted smooth."],
        delta: rare ? { inventory: { artifacts: 1 } } : undefined,
      };
    },
  },
  {
    id: "signs:char-mask",
    tags: ["lore"],
    cooldownDays: 2,
    weight: 0.8,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return { logs: ["On a trunk, a pattern in the char like a face mid-scream."] };
    },
  },
  {
    id: "forage:lichen",
    tags: ["forage"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const good = rng.int(1, 3) === 1;
      return { logs: [good ? "You peel away dry lichen for kindling. (+1 wood)" : "Your fingers come away green from a crust of lichen."], delta: good ? { inventory: { wood: 1 }, wood: 1 } : undefined };
    },
  },
  {
    id: "wildlife:ptarmigan",
    tags: ["wildlife"],
    cooldownDays: 2,
    weight: 0.9,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const chance = rng.int(1, 10) <= 3; // 30%
      return { logs: [chance ? "Ptarmigan burst from underfoot; one doesn’t fly far. (+1 meat)" : "Ptarmigan burst from underfoot in a flurry of snow."], delta: chance ? { inventory: { meat: 1 } } : undefined };
    },
  },
  {
    id: "tracks:fading",
    tags: ["signs"],
    cooldownDays: 1,
    weight: 1.3,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const found = rng.int(0, 1) === 1;
      return {
        logs: found
          ? ["Fading tracks crisscross a slope. You trail them a while, picking a handful of berries. (+1 berries)"]
          : ["Fading tracks crisscross a slope. Nothing worth taking today."],
        delta: found ? { inventory: { berries: 1 } } : undefined,
      };
    },
  },
  {
    id: "cache:stickpile",
    tags: ["find"],
    cooldownDays: 2,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["At a bend in the trail a stickpile lies half-buried. You salvage what you can. (+1 wood)"],
        delta: { inventory: { wood: 1 }, wood: 1 },
      };
    },
  },
  {
    id: "terrain:scree-slip",
    tags: ["hazard"],
    cooldownDays: 2,
    weight: (s) => (s.daysSurvived >= 3 ? 1.2 : 0.6),
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["You slip on loose scree and catch yourself hard. It leaves you aching. (-1 rest)"],
        delta: { rest: -1 },
      };
    },
  },
  {
    id: "weather:brief-sun",
    tags: ["weather","boon"],
    cooldownDays: 2,
    weight: 1.1,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["For a short hour the cloud-thin sun touches your face. It helps. (+1 rest)"],
        delta: { rest: 1 },
      };
    },
  },
  {
    id: "signs:charcoal-mark",
    tags: ["signs","lore"],
    cooldownDays: 2,
    weight: 0.9,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["On a blackened boulder: a charcoal spiral, flaking. You feel watched."],
      };
    },
  },
  {
    id: "forage:thornbriar",
    tags: ["forage"],
    cooldownDays: 1,
    weight: 1.2,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, rng) => {
      void s; void ctx;
      const count = rng.int(1, 2);
      return {
        logs: [
          count === 1
            ? "A thornbriar still clings to a handful of berries. You harvest them. (+1 berries)"
            : "A stubborn thornbriar yields a couple clusters. (+2 berries)",
        ],
        delta: { inventory: { berries: count } },
      };
    },
  },
  {
    id: "fatigue:long-grade",
    tags: ["fatigue"],
    cooldownDays: 1,
    weight: 1.0,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["The grade stretches longer than you thought. You have to stop often. (-1 hunger)"],
        delta: { hunger: -1 },
      };
    },
  },
  {
    id: "trace:smoke-wisp",
    tags: ["signs"],
    cooldownDays: 2,
    weight: 0.8,
    when: (_s, ctx) => ctx.action === "explore",
    effect: (s, ctx, _rng) => {
      void s; void ctx; void _rng;
      return {
        logs: ["For a moment you smell smoke on the wind, then it’s gone."],
      };
    },
  },
];
