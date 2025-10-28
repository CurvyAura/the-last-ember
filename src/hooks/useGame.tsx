"use client";

import { useEffect, useState } from "react";

export type Skills = {
  fireMastery: boolean;
  hunting: boolean;
  exploration: boolean;
};

export type Inventory = {
  wood: number;
  food: number;
  berries: number;
  tools: number;
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

const EVENTS: Array<{ text: string; apply: (s: GameState) => Partial<GameState> }> = [
  {
    text: "You find a small stream.",
    apply: (s) => ({ rest: clamp(s.rest + 1), log: s.log }),
  },
  {
    text: "A wild animal appears but runs away.",
    apply: (s) => ({ log: s.log }),
  },
  {
    text: "You find some berries.",
    apply: (s) => ({ hunger: clamp(s.hunger + 2), log: s.log }),
  },
];

const ACTION_HOURS: Record<string, number> = {
  gather: 4,
  hunt: 6,
  rest: 8,
  explore: 5,
  tend: 2,
  eat: 1,
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
      tools: 0,
      artifacts: 0,
    },
  }));

  useEffect(() => {
    // persist skills only
    saveSkills(skills);
  }, [skills]);

  // local helpers kept inline in main logic

  function performAction(action: "gather" | "hunt" | "rest" | "explore" | "tend" | "eat") {
    setState((s) => {
      if (!s.isRunning) return s;
      
      const hourCost = ACTION_HOURS[action] || 1;
      if (s.hoursRemaining < hourCost) {
        return { ...s, log: [...s.log, `Not enough hours remaining for ${action} (${hourCost}h needed, ${s.hoursRemaining}h left)`] };
      }

      let next = { ...s } as GameState;
      next.hoursRemaining = s.hoursRemaining - hourCost;

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

      if (action === "explore") {
        const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        next = { ...next, ...ev.apply(next) } as GameState;
        
        // Add chance to find items while exploring
        const findChance = Math.random();
        if (findChance < 0.3) {
          const berries = 1 + Math.floor(Math.random() * 2); // 1-2 berries
          next.inventory = { ...next.inventory, berries: next.inventory.berries + berries };
          next.log = [...next.log, `You explore for ${hourCost} hours. ${ev.text} Found ${berries} berries! (${next.hoursRemaining}h left)`];
        } else if (findChance < 0.4) {
          next.inventory = { ...next.inventory, artifacts: next.inventory.artifacts + 1 };
          next.log = [...next.log, `You explore for ${hourCost} hours. ${ev.text} Found an interesting artifact! (${next.hoursRemaining}h left)`];
        } else {
          next.log = [...next.log, `You explore for ${hourCost} hours. ${ev.text} (${next.hoursRemaining}h left)`];
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
        tools: 0,
        artifacts: 0,
      },
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

  return { state, performAction, endDay, unlockSkill, resetRun, eatFood } as const;
}
