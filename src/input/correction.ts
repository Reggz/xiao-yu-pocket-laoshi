const CONFUSION_GROUPS: Array<[string, string]> = [
  ["z", "zh"],
  ["c", "ch"],
  ["s", "sh"],
  ["j", "zh"],
  ["q", "ch"],
  ["x", "sh"],
  ["n", "ng"],
  ["l", "r"],
  ["an", "ang"],
  ["en", "eng"],
  ["in", "ing"],
  ["ian", "iang"],
  ["uan", "uang"],
  ["u", "ü"],
  ["ue", "üe"]
];

function editDistanceOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) {
      i += 1;
    } else if (b.length > a.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }
  return true;
}

function confusionMatch(a: string, b: string): boolean {
  if (a === b) return true;
  for (const [x, y] of CONFUSION_GROUPS) {
    if (a.includes(x) && b.includes(y)) return true;
    if (a.includes(y) && b.includes(x)) return true;
  }
  return false;
}

export function suggestCloseMatches(input: string, vocabulary: string[]): string[] {
  const lower = input.toLowerCase();
  const suggestions = new Set<string>();

  for (const vocab of vocabulary) {
    const v = vocab.toLowerCase();
    if (editDistanceOne(lower, v) || confusionMatch(lower, v)) {
      suggestions.add(vocab);
    }
  }

  return Array.from(suggestions).slice(0, 5);
}
