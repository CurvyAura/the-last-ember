export type RiskLevel = "light" | "moderate" | "spiky";

export type ActionContext = {
  action: "gather" | "hunt" | "rest" | "explore" | "tend" | "eat" | "offer";
  day: number;
  hoursRemaining: number;
};

export type StoryDelta = {
  fire?: number;
  hunger?: number;
  rest?: number;
  wood?: number; // legacy stat used in UI; may stay synced with inventory wood
  inventory?: Partial<{
    wood: number;
    meat: number;
    berries: number;
    artifacts: number;
  }>;
};

export type StoryResult = {
  id?: string; // engine fills from chosen storylet
  logs: string[];
  delta?: StoryDelta;
  flags?: Record<string, boolean | number>;
  cooldownDays?: number; // if set, next allowed day = current day + cooldownDays
  prompt?: StoryPrompt; // optional interactive follow-up
};

export type GameView = {
  fire: number;
  hunger: number;
  rest: number;
  wood: number;
  daysSurvived: number;
  hoursRemaining: number;
  skills: { fireMastery: boolean; hunting: boolean; exploration: boolean };
  inventory: { wood: number; meat: number; berries: number; artifacts: number };
  storyFlags: Record<string, boolean | number>;
  storyCooldowns: Record<string, number>; // storylet id -> next allowed day
};

export type WeightFn = (s: GameView, ctx: ActionContext) => number;

export type Storylet = {
  id: string;
  tags?: string[];
  oncePerRun?: boolean;
  cooldownDays?: number;
  weight?: number | WeightFn;
  when: (s: GameView, ctx: ActionContext) => boolean;
  effect: (s: GameView, ctx: ActionContext, rng: RNG) => StoryResult;
};

export interface RNG {
  seed: number;
  next(): number; // 0..1
  int(min: number, max: number): number; // inclusive
  pick<T>(arr: T[]): T;
}

export type StoryPromptOption = {
  id?: string;
  label: string;
  description?: string;
  // Option effect applied when chosen
  effect: (s: GameView, ctx: ActionContext, rng: RNG) => Pick<StoryResult, "logs" | "delta" | "flags" | "cooldownDays">;
};

export type StoryPrompt = {
  id?: string;
  title?: string;
  body?: string;
  options: StoryPromptOption[];
};
