import { getWindowForTime, DEFAULT_WINDOWS } from "./windows";
import { shouldSendCheckin } from "./checkins";

export type SchedulerInput = {
  time: string;
  userInitiated: boolean;
};

export function evaluateCheckin(input: SchedulerInput) {
  const window = getWindowForTime(input.time, DEFAULT_WINDOWS);
  return shouldSendCheckin(window, input.userInitiated);
}
