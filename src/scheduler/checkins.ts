import { SessionWindow } from "./windows";

export type CheckinDecision = {
  shouldSend: boolean;
  reason: string;
};

export function shouldSendCheckin(
  window: SessionWindow | null,
  userInitiated: boolean
): CheckinDecision {
  if (!window) return { shouldSend: false, reason: "no_window" };
  if (userInitiated) return { shouldSend: false, reason: "user_initiated" };
  return { shouldSend: true, reason: "scheduled" };
}
