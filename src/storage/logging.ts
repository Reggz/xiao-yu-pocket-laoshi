import { normalizeInput } from "../input/normalize";
import { recordInteraction } from "./db";

export type LogInteractionInput = {
  databaseUrl: string;
  telegramId: string;
  telegramHandle?: string;
  preferredName?: string;
  input: string;
  output: string;
  mode: string;
  state?: string;
};

export async function logInteractionSafe(payload: LogInteractionInput): Promise<void> {
  try {
    const normalized = normalizeInput(payload.input);
    await recordInteraction(payload.databaseUrl, {
      telegramId: payload.telegramId,
      telegramHandle: payload.telegramHandle,
      preferredName: payload.preferredName,
      channel: "telegram",
      type: "chat",
      mode: payload.mode,
      state: payload.state ?? "normal",
      inputTextRaw: payload.input,
      inputTextNormalized: normalized.hanzi,
      inputPinyinNormalized: normalized.canonicalPinyin,
      missingTone: normalized.missingTone,
      outputText: payload.output
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("recordInteraction failed", err);
  }
}
