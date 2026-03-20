export const availableTopics = [
  "Self-Intro",
  "Food/Drink",
  "Daily Routine",
  "Numbers/Quantity",
  "Location",
  "Work",
  "Small Talk"
];

export function normalizeTopic(input: string): string | null {
  const normalized = input.trim().toLowerCase();
  const match = availableTopics.find((t) => t.toLowerCase() === normalized);
  return match ?? null;
}

export function validateTopicSelection(topics: string[]): string[] {
  const unique = Array.from(new Set(topics.map((t) => t.trim()))).filter(Boolean);
  if (unique.length > 3) {
    return unique.slice(0, 3);
  }
  return unique;
}
