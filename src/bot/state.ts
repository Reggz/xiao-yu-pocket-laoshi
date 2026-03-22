import { DisambiguationState } from "../input/disambiguation";
import { InteractionSnippet } from "../response/buffer";

export type UserSettings = {
  topics: string[];
  topicBiasRatio: number;
};

export type DrillState = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
};

export type UserSessionState = {
  disambiguation?: DisambiguationState;
  buffer: InteractionSnippet[];
  settings: UserSettings;
  onboardingComplete: boolean;
  paused: boolean;
  lastOnboardingPromptAt?: number;
  lastPausedPromptAt?: number;
  pendingDrill?: DrillState;
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
    paused: false
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

export function setPaused(userId: string, paused: boolean): void {
  const session = getSession(userId);
  session.paused = paused;
}

export function isPaused(userId: string): boolean {
  return getSession(userId).paused;
}

export function resetSession(userId: string): void {
  const session = getSession(userId);
  session.buffer = [];
  session.settings = createDefaultSettings();
  session.onboardingComplete = false;
  session.paused = false;
  delete session.disambiguation;
  delete session.lastOnboardingPromptAt;
  delete session.lastPausedPromptAt;
  delete session.pendingDrill;
}

export function shouldSendOnboardingPrompt(userId: string, nowMs: number, cooldownMs = 3000): boolean {
  const session = getSession(userId);
  if (!session.lastOnboardingPromptAt || nowMs - session.lastOnboardingPromptAt > cooldownMs) {
    session.lastOnboardingPromptAt = nowMs;
    return true;
  }
  return false;
}

export function shouldSendPausedPrompt(userId: string, nowMs: number, cooldownMs = 3000): boolean {
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
