"use client";

import { useEffect, useState } from "react";
import { makeEngine, applyStoryResult } from "@/lib/story/engine";
import type { GameView, RNG, StoryResult } from "@/lib/story/types";

export type Skills = {
  fireMastery: boolean;
  hunting: boolean;
  exploration: boolean;
};

export type Inventory = {
  wood: number;
  meat: number;
  berries: number;
  artifacts: number;
  artifactsByType?: {
    idol: number;
    shard: number;
    heart: number;
    feather: number;
  };
};

export type GameState = {
  fire: number;
  hunger: number;
  rest: number;
  wood: number;
  daysSurvived: number;
  hoursRemaining: number;
  log: string[];
  isRunning: boolean;
  xp: number;
  skills: Skills;
  inventory: Inventory;
  voiceLevel?: number;
  // procedural story state
  storySeed: number;
  storySerial: number; // increments each action for deterministic variety
  storyFlags: Record<string, boolean | number>;
  storyCooldowns: Record<string, number>;
  recentActions: Array<"gather" | "hunt" | "rest" | "explore" | "tend" | "eat" | "offer">;
  currentPrompt: null | {
    id: string;
    title?: string;
    body?: string;
    options: Array<{ label: string; description?: string; _key: string }>;
    _effects: Record<string, (s: GameView, ctx: { action: "explore"; day: number; hoursRemaining: number }, rng: RNG) => Pick<StoryResult, "logs" | "delta" | "flags" | "cooldownDays">>;
  };
};

const STORAGE_KEY = "tle-knowledge";
const VOICE_KEY = "tle-voice";
const RUN_KEY = "tle-run";

function clamp(v: number, a = 0, b = 10) {
  return Math.max(a, Math.min(b, v));
}

function loadSkills(): Skills {
  try {
    const raw = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
    if (!raw) return { fireMastery: false, hunting: false, exploration: false };
    const parsed = JSON.parse(raw);
    return {
      fireMastery: !!parsed.fireMastery,
      hunting: !!parsed.hunting,
      exploration: !!parsed.exploration,
    };
  } catch {
    return { fireMastery: false, hunting: false, exploration: false };
  }
}

function saveSkills(skills: Skills) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  } catch {
    // ignore
  }
}

function loadVoiceLevel(): number {
  try {
    const raw = typeof window !== "undefined" && localStorage.getItem(VOICE_KEY);
    if (!raw) return 0;
    const n = Number(JSON.parse(raw));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  } catch {
    return 0;
  }
}

function saveVoiceLevel(level: number) {
  try {
    localStorage.setItem(VOICE_KEY, JSON.stringify(Math.max(0, Math.floor(level))));
  } catch {
    // ignore
  }
}

function saveRunSnapshot(s: GameState) {
  try {
    // Make a shallow-copy that strips any non-serializable pieces (like effect functions on prompts)
    const toSave: Partial<GameState> = {
      fire: s.fire,
      hunger: s.hunger,
      rest: s.rest,
      wood: s.wood,
      daysSurvived: s.daysSurvived,
      hoursRemaining: s.hoursRemaining,
      log: s.log,
      isRunning: s.isRunning,
      xp: s.xp,
      skills: s.skills,
      inventory: s.inventory,
      voiceLevel: s.voiceLevel,
      storySeed: s.storySeed,
      storySerial: s.storySerial,
      storyFlags: s.storyFlags,
      storyCooldowns: s.storyCooldowns,
      recentActions: s.recentActions,
      // do not persist currentPrompt because it may contain functions (effects)
      currentPrompt: null,
    };
    localStorage.setItem(RUN_KEY, JSON.stringify(toSave));
  } catch {
    // ignore storage errors
  }
}

function loadRunSnapshot(): Partial<GameState> | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

// Story EVENTS replaced by local story engine

const ACTION_HOURS: Record<string, number> = {
  gather: 4,
  hunt: 6,
  rest: 8,
  explore: 5,
  tend: 2,
  eat: 1,
  offer: 1,
};

export function useGame() {
  // Initialize from localStorage once on mount; guarded inside loadSkills()
  const [skills, setSkills] = useState<Skills>(() => loadSkills());
  const [voiceLevel, setVoiceLevel] = useState<number>(() => loadVoiceLevel());

  const [state, setState] = useState<GameState>(() => ({
    fire: 5,
    hunger: 8,
    rest: 8,
    wood: 3,
    daysSurvived: 0,
    hoursRemaining: 24,
    log: [
      "You awaken beside the faint glow of a dying ember — the last warmth in a ruined world.",
      "The forest is silent. The air tastes of ash. Keep the ember alive.",
    ],
    isRunning: true,
    xp: 0,
    skills,
    inventory: {
      wood: 0,
      meat: 0,
      berries: 0,
      artifacts: 0,
      artifactsByType: { idol: 0, shard: 0, heart: 0, feather: 0 },
    },
    voiceLevel: voiceLevel,
    storySeed: Math.floor(Math.random() * 0xffffffff) >>> 0,
    storySerial: 0,
    storyFlags: {},
    storyCooldowns: {},
    recentActions: [],
    currentPrompt: null,
  }));

  useEffect(() => {
    // persist skills only
    saveSkills(skills);
  }, [skills]);

  useEffect(() => {
    saveVoiceLevel(voiceLevel);
  }, [voiceLevel]);

  // Mid-run sync: listen for changes to skills in localStorage from other tabs/windows
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          const nextSkills: Skills = parsed
            ? {
                fireMastery: !!parsed.fireMastery,
                hunting: !!parsed.hunting,
                exploration: !!parsed.exploration,
              }
            : { fireMastery: false, hunting: false, exploration: false };
          setSkills(nextSkills);
          setState((s) => ({ ...s, skills: nextSkills }));
        } catch {
          // ignore parse errors
        }
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  

  // Autosave run state whenever it changes (debounced)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        saveRunSnapshot(state);
      } catch {
        // ignore
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [state]);

  // Load saved run on mount (client-only). We defer setState slightly to avoid hydration mismatch warnings.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = loadRunSnapshot();
      if (!saved) return;
      // Defer to next tick so hydration completes with server-rendered markup first
      setTimeout(() => {
        setState((s) => ({
          ...s,
          fire: typeof saved.fire === "number" ? saved.fire : s.fire,
          hunger: typeof saved.hunger === "number" ? saved.hunger : s.hunger,
          rest: typeof saved.rest === "number" ? saved.rest : s.rest,
          wood: typeof saved.wood === "number" ? saved.wood : s.wood,
          daysSurvived: typeof saved.daysSurvived === "number" ? saved.daysSurvived : s.daysSurvived,
          hoursRemaining: typeof saved.hoursRemaining === "number" ? saved.hoursRemaining : s.hoursRemaining,
          log: Array.isArray(saved.log) ? saved.log : s.log,
          isRunning: typeof saved.isRunning === "boolean" ? saved.isRunning : s.isRunning,
          xp: typeof saved.xp === "number" ? saved.xp : s.xp,
          skills: saved.skills || s.skills,
          inventory: saved.inventory || s.inventory,
          voiceLevel: typeof saved.voiceLevel === "number" ? saved.voiceLevel : s.voiceLevel,
          storySeed: typeof saved.storySeed === "number" ? saved.storySeed : s.storySeed,
          storySerial: typeof saved.storySerial === "number" ? saved.storySerial : s.storySerial,
          storyFlags: saved.storyFlags || s.storyFlags,
          storyCooldowns: saved.storyCooldowns || s.storyCooldowns,
          recentActions: saved.recentActions || s.recentActions,
          currentPrompt: null,
        }));
        if (saved.skills) setSkills(saved.skills as Skills);
        if (typeof saved.voiceLevel === "number") setVoiceLevel(saved.voiceLevel);
      }, 0);
    } catch {
      // ignore
    }
  }, []);

  // local helpers kept inline in main logic

  function performAction(action: "gather" | "hunt" | "rest" | "explore" | "tend" | "eat" | "offer") {
    setState((s) => {
      if (!s.isRunning) return s;
      
      const hourCost = ACTION_HOURS[action] || 1;
      if (s.hoursRemaining < hourCost) {
        return { ...s, log: [...s.log, `Not enough hours remaining for ${action} (${hourCost}h needed, ${s.hoursRemaining}h left)`] };
      }

  const next = { ...s } as GameState;
      next.hoursRemaining = s.hoursRemaining - hourCost;
      next.storySerial = s.storySerial + 1;

      if (action === "gather") {
        const gained = 2;
        next.inventory = { ...next.inventory, wood: next.inventory.wood + gained };
        next.wood = next.wood + gained; // Keep legacy wood stat for now
        next.log = [...next.log, `You gather wood for ${hourCost} hours. (+${gained} wood to inventory, ${next.hoursRemaining}h left)`];
      }

      if (action === "hunt") {
        const chance = 0.7 + (s.skills.hunting ? 0.15 : 0);
        if (Math.random() < chance) {
          let meat = s.skills.hunting ? 2 : 1;
          if ((s.voiceLevel || 0) >= 2) meat += 1;
          next.inventory = { ...next.inventory, meat: next.inventory.meat + meat };
          next.log = [...next.log, `You hunt for ${hourCost} hours and catch prey. (+${meat} meat to inventory, ${next.hoursRemaining}h left)`];
        } else {
          next.log = [...next.log, `You hunt for ${hourCost} hours but find nothing. (${next.hoursRemaining}h left)`];
        }
      }

      if (action === "eat") {
        let hungerGained = 0;
        let consumed = "";
        if (next.inventory.meat > 0) {
          next.inventory = { ...next.inventory, meat: next.inventory.meat - 1 };
          hungerGained = 3;
          consumed = "meat";
        } else if (next.inventory.berries > 0) {
          next.inventory = { ...next.inventory, berries: next.inventory.berries - 1 };
          hungerGained = 2;
          consumed = "berries";
        }
        if (hungerGained > 0) {
          next.hunger = clamp(next.hunger + hungerGained);
          next.log = [...next.log, `You eat ${consumed} for ${hourCost} hour. (+${hungerGained} hunger, ${next.hoursRemaining}h left)`];
        } else {
          next.log = [...next.log, `You spend ${hourCost} hour looking for food but have nothing to eat. (${next.hoursRemaining}h left)`];
        }
      }

      if (action === "rest") {
        const gain = 3 + ((s.voiceLevel || 0) >= 4 ? 1 : 0);
        next.rest = clamp(next.rest + gain);
        next.log = [...next.log, `You rest for ${hourCost} hours. (+${gain} rest, ${next.hoursRemaining}h left)`];
      }

      if (action === "offer") {
        // One-day cooldown key
        const cdKey = "ability:offer-ember";
        const lockUntil = s.storyCooldowns[cdKey];
        const onCooldown = typeof lockUntil === "number" && s.daysSurvived < lockUntil;

        if (onCooldown) {
          next.log = [...next.log, `You kneel to offer, but the ember takes nothing today. (${next.hoursRemaining}h left)`];
        } else {
          const t = pickFirstAvailableArtifact(next.inventory.artifactsByType || { idol: 0, shard: 0, heart: 0, feather: 0 });
          if (!t) {
            next.log = [...next.log, `You search your pack for anything sacred to offer, but find nothing. (${next.hoursRemaining}h left)`];
          } else {
            const res = internalOfferArtifact(next, s, t);
            next.inventory = res.inventory;
            next.fire = res.fire;
            next.rest = res.rest;
            next.storyCooldowns = res.storyCooldowns;
            next.voiceLevel = res.voiceLevel;
            next.log = [...next.log, ...res.logs];
          }
        }
      }

      if (action === "explore") {
        // Procedural story engine: always attempt a major beat on explore
        const engine = makeEngine(next.storySeed + next.storySerial, { risk: "moderate" });
        const view: GameView = {
          fire: next.fire,
          hunger: next.hunger,
          rest: next.rest,
          wood: next.wood,
          daysSurvived: next.daysSurvived,
          hoursRemaining: next.hoursRemaining,
          skills: next.skills,
          inventory: next.inventory,
          storyFlags: next.storyFlags,
          storyCooldowns: next.storyCooldowns,
        };
        const ctx = { action: "explore" as const, day: next.daysSurvived, hoursRemaining: next.hoursRemaining };
        // Pity timer: guarantee 1st artifact by Day 3; 50% chance on Day 2 if none found
        const hasAnyArtifact = (next.inventory.artifacts || 0) > 0;
        const pityGiven = !!next.storyFlags["pity:artifact:given"];
        let beat = null as ReturnType<typeof engine.generateStoryBeat>;
        if (!hasAnyArtifact && !pityGiven && (ctx.day >= 3 || (ctx.day >= 2 && engine.rng.int(1, 2) === 1))) {
          beat = {
            id: "pity:artifact",
            logs: [
              "Half-buried in ash, something glints. You dig it out: a relic. (+1 artifact)",
            ],
            delta: { inventory: { artifacts: 1 } },
            flags: { "pity:artifact:given": true },
            cooldownDays: 0,
          };
        } else {
          beat = engine.generateStoryBeat(view, ctx);
        }
        if (beat) {
          // If interactive prompt, defer delta application until user chooses
          if (beat.prompt) {
            // Set seen flag and cooldown now
            const applied = applyStoryResult(view, ctx, { ...beat, delta: undefined, logs: beat.logs || [] });
            next.storyFlags = applied.nextFlags;
            next.storyCooldowns = applied.nextCooldowns;
            if (applied.logs?.length) next.log = [...next.log, ...applied.logs.map((l) => l.trim())];
            // Prepare prompt in state with effect functions mapped by key
            const effectsMap: Record<string, (s: GameView, ctx: { action: "explore"; day: number; hoursRemaining: number }, rng: RNG) => Pick<StoryResult, "logs" | "delta" | "flags" | "cooldownDays">> = {};
            const options = beat.prompt.options.map((opt, idx) => {
              const key = `${beat.id || "prompt"}:${idx}`;
              effectsMap[key] = opt.effect;
              return { label: opt.label, description: opt.description, _key: key };
            });
            next.currentPrompt = {
              id: beat.id || "",
              title: beat.prompt.title,
              body: beat.prompt.body,
              options,
              _effects: effectsMap,
            };
          } else {
            const applied = applyStoryResult(view, ctx, beat);
            // apply delta safely
            const d = applied.delta || {};
            if (typeof d.fire === "number") next.fire = clamp(next.fire + d.fire);
            if (typeof d.hunger === "number") next.hunger = clamp(next.hunger + d.hunger);
            if (typeof d.rest === "number") next.rest = clamp(next.rest + d.rest);
            if (typeof d.wood === "number") next.wood = Math.max(0, next.wood + d.wood);
            if (d.inventory) {
              let inv = {
                ...next.inventory,
                wood: Math.max(0, next.inventory.wood + (d.inventory.wood || 0)),
                meat: Math.max(0, next.inventory.meat + (d.inventory.meat || 0)),
                berries: Math.max(0, next.inventory.berries + (d.inventory.berries || 0)),
                artifactsByType: next.inventory.artifactsByType || { idol: 0, shard: 0, heart: 0, feather: 0 },
              } as Inventory;
              const addArtifacts = d.inventory.artifacts || 0;
              if (addArtifacts > 0) {
                for (let i = 0; i < addArtifacts; i++) {
                  const r = engine.rng.next();
                  const pick = r < 0.25 ? "idol" : r < 0.5 ? "shard" : r < 0.75 ? "heart" : "feather";
                  inv.artifactsByType = { ...inv.artifactsByType!, [pick]: (inv.artifactsByType?.[pick] || 0) + 1 } as NonNullable<Inventory["artifactsByType"]>;
                }
                inv = syncArtifactTotal(inv);
              }
              next.inventory = inv;
            }
            next.storyFlags = applied.nextFlags;
            next.storyCooldowns = applied.nextCooldowns;
            next.log = [...next.log, ...applied.logs.map((l) => l.trim())];
          }
        } else {
          next.log = [...next.log, `You explore for ${hourCost} hours. (${next.hoursRemaining}h left)`];
        }
      }

      if (action === "tend") {
        if (next.inventory.wood > 0 || next.wood > 0) {
          const use = 1;
          if (next.inventory.wood > 0) {
            next.inventory = { ...next.inventory, wood: next.inventory.wood - use };
          } else {
            next.wood = Math.max(0, next.wood - use);
          }
          next.fire = clamp(next.fire + 3);
          next.log = [...next.log, `You tend the fire for ${hourCost} hours, burning ${use} wood from inventory. (+3 fire, ${next.hoursRemaining}h left)`];
        } else {
          next.log = [...next.log, `You spend ${hourCost} hours tending the fire, but have no wood to burn. (${next.hoursRemaining}h left)`];
        }
      }

      // light flavor for other actions (engine handles probability)
      if (action !== "explore") {
        const engine = makeEngine(next.storySeed + next.storySerial, { risk: "moderate" });
        const view: GameView = {
          fire: next.fire,
          hunger: next.hunger,
          rest: next.rest,
          wood: next.wood,
          daysSurvived: next.daysSurvived,
          hoursRemaining: next.hoursRemaining,
          skills: next.skills,
          inventory: next.inventory,
          storyFlags: next.storyFlags,
          storyCooldowns: next.storyCooldowns,
        };
        const ctx = { action, day: next.daysSurvived, hoursRemaining: next.hoursRemaining } as const;
        const line = engine.generateFlavor(view, ctx);
        if (line) next.log = [...next.log, line];
      }

      // track recent actions
      next.recentActions = [...next.recentActions, action].slice(-6);

      return next;
    });
  }

  type ArtifactType = "idol" | "shard" | "heart" | "feather";

  function sumArtifacts(inv: Inventory) {
    const t = inv.artifactsByType || { idol: 0, shard: 0, heart: 0, feather: 0 };
    return (t.idol || 0) + (t.shard || 0) + (t.heart || 0) + (t.feather || 0);
  }

  function syncArtifactTotal(inv: Inventory): Inventory {
    const total = sumArtifacts(inv);
    return { ...inv, artifacts: total };
  }

  function pickFirstAvailableArtifact(t: NonNullable<Inventory["artifactsByType"]>): ArtifactType | null {
    if ((t.idol || 0) > 0) return "idol";
    if ((t.shard || 0) > 0) return "shard";
    if ((t.heart || 0) > 0) return "heart";
    if ((t.feather || 0) > 0) return "feather";
    return null;
  }

  function internalOfferArtifact(next: GameState, s: GameState, type: ArtifactType) {
    const cdKey = "ability:offer-ember";
    const logs: string[] = [];
    const counts = { ...(next.inventory.artifactsByType || { idol: 0, shard: 0, heart: 0, feather: 0 }) } as NonNullable<Inventory["artifactsByType"]>;
    counts[type] = Math.max(0, (counts[type] || 0) - 1);
    let inv = { ...next.inventory, artifactsByType: counts } as Inventory;
    inv = syncArtifactTotal(inv);
    const fire = clamp(next.fire + 4);
    const rest = clamp(next.rest + 1);
    const newVoice = (s.voiceLevel || 0) + 1;

    const skillCount = Object.values(s.skills).filter(Boolean).length;
    const voiceRich = newVoice >= 3 || skillCount >= 2;
    if (type === "idol") {
      logs.push(`You offer an ancient idol to the ember. (+4 fire, +1 rest, ${next.hoursRemaining}h left)`);
      logs.push("Gold eyes melt. The ember whispers of forgotten rites.");
      if (!s.skills.fireMastery) {
        const newSkills = { ...s.skills, fireMastery: true } as Skills;
        setSkills(newSkills);
        next.skills = newSkills;
        logs.push("A memory settles: how to shelter flame from wind and time. [Fire Mastery unlocked]");
      }
    } else if (type === "shard") {
      logs.push(`You offer a blackened shard. (+4 fire, +1 rest, ${next.hoursRemaining}h left)`);
      logs.push("It drinks the light and returns a path through the dark.");
      if (!s.skills.exploration) {
        const newSkills = { ...s.skills, exploration: true } as Skills;
        setSkills(newSkills);
        next.skills = newSkills;
        logs.push("The world’s edges sharpen. [Exploration unlocked]");
      }
    } else if (type === "feather") {
      logs.push(`You offer a silver feather. (+4 fire, +1 rest, ${next.hoursRemaining}h left)`);
      logs.push("Ash eddies. Footfalls map themselves in your mind.");
      if (!s.skills.hunting) {
        const newSkills = { ...s.skills, hunting: true } as Skills;
        setSkills(newSkills);
        next.skills = newSkills;
        logs.push("Your hands remember the chase. [Hunting unlocked]");
      }
    } else if (type === "heart") {
      logs.push(`You offer a heart of ice. (+4 fire, +1 rest, ${next.hoursRemaining}h left)`);
      logs.push(voiceRich ? "Steam rises like a prayer. The ember speaks a name you almost know." : "Frost hisses, vanishing to nothing.");
    }

    const storyCooldowns = { ...s.storyCooldowns, [cdKey]: s.daysSurvived + 1 };
    return { inventory: inv, fire, rest, voiceLevel: newVoice, storyCooldowns, logs };
  }

  function offerArtifact(type: ArtifactType) {
    setState((s) => {
      if (!s.isRunning) return s;
      const hourCost = ACTION_HOURS["offer"] || 1;
      if (s.hoursRemaining < hourCost) {
        return { ...s, log: [...s.log, `Not enough hours remaining for offer (${hourCost}h needed, ${s.hoursRemaining}h left)`] } as GameState;
      }
      const cdKey = "ability:offer-ember";
      const lockUntil = s.storyCooldowns[cdKey];
      const onCooldown = typeof lockUntil === "number" && s.daysSurvived < lockUntil;
      if (onCooldown) {
        return { ...s, hoursRemaining: s.hoursRemaining - hourCost, log: [...s.log, `You kneel to offer, but the ember takes nothing today. (${s.hoursRemaining - hourCost}h left)`] } as GameState;
      }
      if (!s.inventory.artifactsByType || (s.inventory.artifactsByType[type] || 0) <= 0) {
        return { ...s, log: [...s.log, `You have no ${type} to offer.`] } as GameState;
      }
      const next = { ...s } as GameState;
      next.hoursRemaining = s.hoursRemaining - hourCost;
      next.storySerial = s.storySerial + 1;
      const res = internalOfferArtifact(next, s, type);
      next.inventory = res.inventory;
      next.fire = res.fire;
      next.rest = res.rest;
      next.storyCooldowns = res.storyCooldowns;
      next.voiceLevel = res.voiceLevel;
      setVoiceLevel(res.voiceLevel || 0);
      next.log = [...next.log, ...res.logs];
      return next;
    });
  }

  function unlockSkill(skill: keyof Skills) {
    setState((s) => {
      if (s.xp <= 0) return s;
      const cost = 3;
      if (s.xp < cost) return s;
      if (s.skills[skill]) return s;
      const newSkills = { ...s.skills, [skill]: true } as Skills;
      setSkills(newSkills);
      // spend xp
      const remainingXp = s.xp - cost;
      const newState = { ...s, skills: newSkills, xp: remainingXp } as GameState;
      return newState;
    });
  }

  // Consume food from inventory. foodType should be either 'food' (meat) or 'berries'.
  function eatFood(foodType: "meat" | "berries", quantity: number) {
    setState((s) => {
      if (!s.isRunning) return s;

      const perItemHours = ACTION_HOURS["eat"] || 1;
      const totalHours = perItemHours * quantity;
      if (s.hoursRemaining < totalHours) {
        return { ...s, log: [...s.log, `Not enough hours remaining to eat ${quantity} ${foodType} (${totalHours}h needed, ${s.hoursRemaining}h left)`] } as GameState;
      }

      const available = foodType === "meat" ? s.inventory.meat : s.inventory.berries;
      const use = Math.max(0, Math.min(available, quantity));
      if (use <= 0) {
        return { ...s, log: [...s.log, `You try to eat ${foodType} but have none.`] } as GameState;
      }

      const hungerPerItem = foodType === "meat" ? 3 : 2;
      const totalHunger = hungerPerItem * use;

      const next = { ...s } as GameState;
      if (foodType === "meat") {
        next.inventory = { ...next.inventory, meat: next.inventory.meat - use } as Inventory;
      } else {
        next.inventory = { ...next.inventory, berries: next.inventory.berries - use } as Inventory;
      }
      next.hunger = clamp(next.hunger + totalHunger);
      next.hoursRemaining = next.hoursRemaining - totalHours;
      next.log = [...next.log, `You eat ${use} ${foodType} for ${totalHours} hour${totalHours > 1 ? "s" : ""}. (+${totalHunger} hunger, ${next.hoursRemaining}h left)`];

      return next;
    });
  }

  // Respond to an interactive story prompt by option index
  function respondToPrompt(optionIndex: number) {
    setState((s) => {
      if (!s.isRunning) return s;
      if (!s.currentPrompt) return s;
      const prompt = s.currentPrompt;
      const opt = prompt.options[optionIndex];
      if (!opt) return s;

      const engine = makeEngine(s.storySeed + s.storySerial + 7, { risk: "moderate" });
      const view: GameView = {
        fire: s.fire,
        hunger: s.hunger,
        rest: s.rest,
        wood: s.wood,
        daysSurvived: s.daysSurvived,
        hoursRemaining: s.hoursRemaining,
        skills: s.skills,
        inventory: s.inventory,
        storyFlags: s.storyFlags,
        storyCooldowns: s.storyCooldowns,
      };
      const ctx = { action: "explore" as const, day: s.daysSurvived, hoursRemaining: s.hoursRemaining };
      const effectFn = prompt._effects[opt._key];
      if (!effectFn) return s;

      const res = effectFn(view, ctx, engine.rng);
      const next = { ...s } as GameState;
      // apply delta
      const d = res.delta || {};
      if (typeof d.fire === "number") next.fire = clamp(next.fire + d.fire);
      if (typeof d.hunger === "number") next.hunger = clamp(next.hunger + d.hunger);
      if (typeof d.rest === "number") next.rest = clamp(next.rest + d.rest);
      if (typeof d.wood === "number") next.wood = Math.max(0, next.wood + d.wood);
      if (d.inventory) {
        let inv = {
          ...next.inventory,
          wood: Math.max(0, next.inventory.wood + (d.inventory.wood || 0)),
          meat: Math.max(0, next.inventory.meat + (d.inventory.meat || 0)),
          berries: Math.max(0, next.inventory.berries + (d.inventory.berries || 0)),
          artifactsByType: next.inventory.artifactsByType || { idol: 0, shard: 0, heart: 0, feather: 0 },
        } as Inventory;
        const addArtifacts = d.inventory.artifacts || 0;
        if (addArtifacts > 0) {
          for (let i = 0; i < addArtifacts; i++) {
            const r = engine.rng.next();
            const pick = r < 0.25 ? "idol" : r < 0.5 ? "shard" : r < 0.75 ? "heart" : "feather";
            inv.artifactsByType = { ...inv.artifactsByType!, [pick]: (inv.artifactsByType?.[pick] || 0) + 1 } as NonNullable<Inventory["artifactsByType"]>;
          }
          inv = syncArtifactTotal(inv);
        }
        next.inventory = inv;
      }
      // flags/cooldowns from option
      next.storyFlags = { ...next.storyFlags, ...(res.flags || {}) };
      if (typeof res.cooldownDays === "number" && (prompt.id || "")) {
        next.storyCooldowns = { ...next.storyCooldowns, [prompt.id!]: s.daysSurvived + res.cooldownDays };
      }
      next.log = [...next.log, ...(res.logs || []).map((l) => l.trim())];
      next.currentPrompt = null;
      return next;
    });
  }

  function resetRun() {
    setState((s) => ({
      fire: 5,
      hunger: 8,
      rest: 8,
      wood: 3,
      daysSurvived: 0,
      hoursRemaining: 24,
      log: [
        "You wake again beside the ember. Different hands. Same cold.",
        "The ember remembers what you do not. Keep it alive."
      ],
      isRunning: true,
      xp: 0,
      skills: s.skills,
      inventory: {
        wood: 0,
        meat: 0,
        berries: 0,
        artifacts: 0,
        artifactsByType: { idol: 0, shard: 0, heart: 0, feather: 0 },
      },
      voiceLevel: s.voiceLevel,
      storySeed: Math.floor(Math.random() * 0xffffffff) >>> 0,
      storySerial: 0,
      storyFlags: {},
      storyCooldowns: {},
      recentActions: [],
      currentPrompt: null,
    }));
    try {
      localStorage.removeItem(RUN_KEY);
    } catch {
      // ignore
    }
  }

  function endDay() {
    setState((s) => {
      if (!s.isRunning) return s;

      const next = { ...s } as GameState;

      // Apply daily costs
      next.hunger = clamp(next.hunger - 2);
      next.rest = clamp(next.rest - 1);

      // Fire decay
      const decay = s.skills.fireMastery ? 0 : 1;
      next.fire = clamp(next.fire - decay);

      // Reset hours for new day
      next.hoursRemaining = 24;
      next.daysSurvived = next.daysSurvived + 1;
      const decayParts = ["-2 hunger", "-1 rest"]; if (decay > 0) decayParts.push("-1 fire");
      next.log = [
        ...next.log,
        `Night passes. (${decayParts.join(", ")})`,
        `Day ${next.daysSurvived} begins. You have 24 hours.`,
      ];

      // Check end conditions
      if (next.fire <= 0) {
        next.isRunning = false;
        next.xp = next.daysSurvived;
        next.log = [...next.log, "Your fire goes out. The cold takes you."];
      }
      if (next.hunger <= 0) {
        next.isRunning = false;
        next.xp = next.daysSurvived;
        next.log = [...next.log, "You starve from hunger."];
      }
      if (next.rest <= 0) {
        next.isRunning = false;
        next.xp = next.daysSurvived;
        next.log = [...next.log, "Exhaustion claims you."];
      }

      return next;
    });
  }

  return { state, performAction, endDay, unlockSkill, resetRun, eatFood, respondToPrompt, offerArtifact } as const;
}
