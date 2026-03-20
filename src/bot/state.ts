import { DisambiguationState } from "../input/disambiguation";
import { InteractionSnippet } from "../response/buffer";

export type UserSettings = {
  topics: string[];
  topicBiasRatio: number;
};

export type UserSessionState = {
  disambiguation?: DisambiguationState;
  buffer: InteractionSnippet[];
  settings: UserSettings;
};

const state = new Map<string, UserSessionState>();

function createDefaultSettings(): UserSettings {
  return { topics: [], topicBiasRatio: 0.7 };
}

export function getSession(userId: string): UserSessionState {
  const existing = state.get(userId);
  if (existing) return existing;
  const created: UserSessionState = { buffer: [], settings: createDefaultSettings() };
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
