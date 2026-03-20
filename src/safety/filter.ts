const BLOCKLIST = [
  "porn",
  "sex",
  "nude",
  "nudity",
  "rape",
  "hate",
  "kill",
  "terror",
  "suicide",
  "genocide",
  "slur"
];

export type SafetyResult = {
  blocked: boolean;
  reason?: string;
};

export function checkSafety(input: string): SafetyResult {
  const lower = input.toLowerCase();
  for (const term of BLOCKLIST) {
    if (lower.includes(term)) {
      return { blocked: true, reason: term };
    }
  }
  return { blocked: false };
}

export function safetyResponse(): string {
  return "Let's keep it respectful and focus on language practice.";
}
