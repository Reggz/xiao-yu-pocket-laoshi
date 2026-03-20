export type SessionWindow = {
  name: "morning" | "afternoon" | "evening";
  start: string;
  end: string;
};

export const DEFAULT_WINDOWS: SessionWindow[] = [
  { name: "morning", start: "06:00", end: "12:00" },
  { name: "afternoon", start: "12:00", end: "18:00" },
  { name: "evening", start: "18:00", end: "24:00" }
];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}

export function getWindowForTime(time: string, windows = DEFAULT_WINDOWS): SessionWindow | null {
  const minutes = toMinutes(time);
  for (const window of windows) {
    const start = toMinutes(window.start);
    const end = toMinutes(window.end);
    if (minutes >= start && minutes < end) return window;
  }
  return null;
}
