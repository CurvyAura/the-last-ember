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
  food: number;
  berries: number;
  artifacts: number;
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

  const [state, setState] = useState<GameState>(() => ({
    fire: 5,
    hunger: 8,
    rest: 8,
    wood: 3,
    daysSurvived: 0,
    hoursRemaining: 24,
    log: ["You wake to a cold dawn. Keep the ember alive."],
    isRunning: true,
    xp: 0,
    skills,
    inventory: {
      wood: 0,
      food: 0,
      berries: 0,
      artifacts: 0,
    },
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
          const meat = s.skills.hunting ? 2 : 1;
          next.inventory = { ...next.inventory, food: next.inventory.food + meat };
          next.log = [...next.log, `You hunt for ${hourCost} hours and catch prey. (+${meat} food to inventory, ${next.hoursRemaining}h left)`];
        } else {
          next.log = [...next.log, `You hunt for ${hourCost} hours but find nothing. (${next.hoursRemaining}h left)`];
        }
      }

      if (action === "eat") {
        let hungerGained = 0;
        let consumed = "";
        
        // Prioritize meat over berries for now (can enhance later with choice)
        if (next.inventory.food > 0) {
          next.inventory = { ...next.inventory, food: next.inventory.food - 1 };
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
        const gain = 3;
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
        } else if (next.inventory.artifacts > 0) {
          next.inventory = { ...next.inventory, artifacts: next.inventory.artifacts - 1 };
          next.fire = clamp(next.fire + 4);
          next.rest = clamp(next.rest + 1);
          next.storyCooldowns = { ...next.storyCooldowns, [cdKey]: s.daysSurvived + 1 };
          next.log = [...next.log, `You offer a relic to the ember. It flares, warm and bright. (+4 fire, +1 rest, ${next.hoursRemaining}h left)`];
        } else {
          next.log = [...next.log, `You search your pack for anything sacred to offer, but find nothing. (${next.hoursRemaining}h left)`];
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
        const beat = engine.generateStoryBeat(view, ctx);
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
              next.inventory = {
                ...next.inventory,
                wood: Math.max(0, next.inventory.wood + (d.inventory.wood || 0)),
                food: Math.max(0, next.inventory.food + (d.inventory.food || 0)),
                berries: Math.max(0, next.inventory.berries + (d.inventory.berries || 0)),
                artifacts: Math.max(0, next.inventory.artifacts + (d.inventory.artifacts || 0)),
              };
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
  function eatFood(foodType: "food" | "berries", quantity: number) {
    setState((s) => {
      if (!s.isRunning) return s;

      const perItemHours = ACTION_HOURS["eat"] || 1;
      const totalHours = perItemHours * quantity;
      if (s.hoursRemaining < totalHours) {
        return { ...s, log: [...s.log, `Not enough hours remaining to eat ${quantity} ${foodType} (${totalHours}h needed, ${s.hoursRemaining}h left)`] } as GameState;
      }

      const available = s.inventory[foodType] || 0;
      const use = Math.max(0, Math.min(available, quantity));
      if (use <= 0) {
        return { ...s, log: [...s.log, `You try to eat ${foodType} but have none.`] } as GameState;
      }

      const hungerPerItem = foodType === "food" ? 3 : 2;
      const totalHunger = hungerPerItem * use;

      const next = { ...s } as GameState;
      next.inventory = { ...next.inventory, [foodType]: next.inventory[foodType] - use } as Inventory;
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
        next.inventory = {
          ...next.inventory,
          wood: Math.max(0, next.inventory.wood + (d.inventory.wood || 0)),
          food: Math.max(0, next.inventory.food + (d.inventory.food || 0)),
          berries: Math.max(0, next.inventory.berries + (d.inventory.berries || 0)),
          artifacts: Math.max(0, next.inventory.artifacts + (d.inventory.artifacts || 0)),
        };
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
      log: ["A new run begins. Keep the ember alive."],
      isRunning: true,
      xp: 0,
      skills: s.skills,
      inventory: {
        wood: 0,
        food: 0,
        berries: 0,
        artifacts: 0,
      },
      storySeed: Math.floor(Math.random() * 0xffffffff) >>> 0,
      storySerial: 0,
      storyFlags: {},
      storyCooldowns: {},
      recentActions: [],
      currentPrompt: null,
    }));
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
      next.log = [...next.log, `Day ${next.daysSurvived} begins. You have 24 hours.`];

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

  return { state, performAction, endDay, unlockSkill, resetRun, eatFood, respondToPrompt } as const;
}
