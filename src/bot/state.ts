import { DisambiguationState } from "../input/disambiguation";
import { InteractionSnippet } from "../response/buffer";

export type UserSettings = {
  topics: string[];
  topicBiasRatio: number;
};

export type DrillType = "vocab" | "grammar" | "complete_sentence" | "reply_sentence";
export type DrillFocus = DrillType;

export type DrillState = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  type: DrillType;
  target?: string;
  key?: string;
  context?: {
    promptMeaning?: string;
    promptHanzi?: string;
  };
};

export type DrillSessionState = {
  total: number;
  remaining: number;
  correct: number;
  items: string[];
  topic: string;
  focus: DrillFocus;
  askedByType: Record<DrillType, number>;
  wrongByType: Record<DrillType, number>;
  askedKeys: string[];
  lastAskedKey?: string;
};

export type DrillSetupStage = "topic" | "focus" | "count";

export type DrillSetupState = {
  stage: DrillSetupStage;
  topic?: string;
  focus?: DrillFocus;
};

export type PlacementState = {
  active: boolean;
  index: number;
  correct: number;
};

export type ActiveMode = "menu" | "drill" | "free_chat";

export type UserSessionState = {
  disambiguation?: DisambiguationState;
  buffer: InteractionSnippet[];
  settings: UserSettings;
  onboardingComplete: boolean;
  onboardingPrompted: boolean;
  paused: boolean;
  lastOnboardingPromptAt?: number;
  lastPausedPromptAt?: number;
  lastMenuPromptAt?: number;
  pendingDrill?: DrillState;
  drillSession?: DrillSessionState;
  drillSetup?: DrillSetupState;
  placement?: PlacementState;
  level: string;
  guidedStage?: number;
  activeMode?: ActiveMode;
};

const state = new Map<string, UserSessionState>();

function createDefaultSettings(): UserSettings {
  return { topics: [], topicBiasRatio: 0.7 };
}

export function getSession(userId: string): UserSessionState {
  const existing = state.get(userId);
  if (existing) return existing;
  const created: UserSessionState = {
    buffer: [],
    settings: createDefaultSettings(),
    onboardingComplete: false,
    onboardingPrompted: false,
    paused: false,
    level: "A0",
    guidedStage: 0,
    activeMode: undefined
  };
  state.set(userId, created);
  return created;
}

export function clearDisambiguation(userId: string): void {
  const session = getSession(userId);
  delete session.disambiguation;
}

export function setDisambiguation(userId: string, disamb: DisambiguationState): void {
  const session = getSession(userId);
  session.disambiguation = disamb;
}

export function appendInteraction(userId: string, input: string, output: string): void {
  const session = getSession(userId);
  session.buffer.push({ input, output });
  if (session.buffer.length > 20) {
    session.buffer = session.buffer.slice(-20);
  }
}

export function setTopics(userId: string, topics: string[]): void {
  const session = getSession(userId);
  session.settings.topics = topics;
}

export function getTopics(userId: string): string[] {
  return getSession(userId).settings.topics;
}

export function setTopicBiasRatio(userId: string, ratio: number): void {
  const session = getSession(userId);
  session.settings.topicBiasRatio = ratio;
}

export function getTopicBiasRatio(userId: string): number {
  return getSession(userId).settings.topicBiasRatio;
}

export function setOnboardingComplete(userId: string, complete: boolean): void {
  const session = getSession(userId);
  session.onboardingComplete = complete;
}

export function isOnboardingComplete(userId: string): boolean {
  return getSession(userId).onboardingComplete;
}

export function setOnboardingPrompted(userId: string, prompted: boolean): void {
  const session = getSession(userId);
  session.onboardingPrompted = prompted;
}

export function isPaused(userId: string): boolean {
  return getSession(userId).paused;
}

export function setPaused(userId: string, paused: boolean): void {
  const session = getSession(userId);
  session.paused = paused;
}

export function resetSession(userId: string): void {
  const session = getSession(userId);
  session.buffer = [];
  session.settings = createDefaultSettings();
  session.onboardingComplete = false;
  session.onboardingPrompted = false;
  session.paused = false;
  session.level = "A0";
  session.guidedStage = 0;
  session.activeMode = undefined;
  delete session.disambiguation;
  delete session.lastOnboardingPromptAt;
  delete session.lastPausedPromptAt;
  delete session.lastMenuPromptAt;
  delete session.pendingDrill;
  delete session.drillSession;
  delete session.drillSetup;
  delete session.placement;
}

export function shouldSendOnboardingPrompt(userId: string, nowMs: number, cooldownMs = 30000): boolean {
  const session = getSession(userId);
  if (session.onboardingPrompted) return false;
  if (!session.lastOnboardingPromptAt || nowMs - session.lastOnboardingPromptAt > cooldownMs) {
    session.lastOnboardingPromptAt = nowMs;
    session.onboardingPrompted = true;
    return true;
  }
  return false;
}

export function shouldSendMenuPrompt(userId: string, nowMs: number, cooldownMs = 15000): boolean {
  const session = getSession(userId);
  if (!session.lastMenuPromptAt || nowMs - session.lastMenuPromptAt > cooldownMs) {
    session.lastMenuPromptAt = nowMs;
    return true;
  }
  return false;
}

export function shouldSendPausedPrompt(userId: string, nowMs: number, cooldownMs = 30000): boolean {
  const session = getSession(userId);
  if (!session.lastPausedPromptAt || nowMs - session.lastPausedPromptAt > cooldownMs) {
    session.lastPausedPromptAt = nowMs;
    return true;
  }
  return false;
}

export function setPendingDrill(userId: string, drill: DrillState | undefined): void {
  const session = getSession(userId);
  session.pendingDrill = drill;
}

export function getPendingDrill(userId: string): DrillState | undefined {
  return getSession(userId).pendingDrill;
}

export function setDrillSession(userId: string, drillSession: DrillSessionState | undefined): void {
  const session = getSession(userId);
  session.drillSession = drillSession;
}

export function getDrillSession(userId: string): DrillSessionState | undefined {
  return getSession(userId).drillSession;
}

export function setDrillSetup(userId: string, drillSetup: DrillSetupState | undefined): void {
  const session = getSession(userId);
  session.drillSetup = drillSetup;
}

export function getDrillSetup(userId: string): DrillSetupState | undefined {
  return getSession(userId).drillSetup;
}

export function setActiveMode(userId: string, mode: ActiveMode | undefined): void {
  const session = getSession(userId);
  session.activeMode = mode;
}

export function getActiveMode(userId: string): ActiveMode | undefined {
  return getSession(userId).activeMode;
}

export function startPlacement(userId: string): void {
  const session = getSession(userId);
  session.placement = { active: true, index: 0, correct: 0 };
}

export function stopPlacement(userId: string): void {
  const session = getSession(userId);
  delete session.placement;
}

export function getPlacement(userId: string): PlacementState | undefined {
  return getSession(userId).placement;
}

export function updatePlacement(userId: string, correct: boolean): void {
  const session = getSession(userId);
  if (!session.placement) return;
  if (correct) session.placement.correct += 1;
  session.placement.index += 1;
}

export function setLevel(userId: string, level: string): void {
  const session = getSession(userId);
  session.level = level;
}

export function getLevel(userId: string): string {
  return getSession(userId).level;
}

export function setGuidedStage(userId: string, stage: number): void {
  const session = getSession(userId);
  session.guidedStage = stage;
}
