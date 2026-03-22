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
    if (a.startsWith(x) && b.startsWith(y) && a.slice(x.length) === b.slice(y.length)) return true;
    if (a.startsWith(y) && b.startsWith(x) && a.slice(y.length) === b.slice(x.length)) return true;
    if (a.endsWith(x) && b.endsWith(y) && a.slice(0, -x.length) === b.slice(0, -y.length)) return true;
    if (a.endsWith(y) && b.endsWith(x) && a.slice(0, -y.length) === b.slice(0, -x.length)) return true;
  }
  return false;
}

function normalizeSyllables(input: string): string[] {
  return input
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
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

export function suggestCloseMatchesBySyllable(input: string, vocabulary: string[]): string[] {
  const inputSyl = normalizeSyllables(input);
  if (!inputSyl.length) return [];

  const suggestions = new Set<string>();
  for (const vocab of vocabulary) {
    const vocabSyl = normalizeSyllables(vocab);
    if (vocabSyl.length !== inputSyl.length) continue;
    let mismatches = 0;
    let ok = true;
    for (let i = 0; i < vocabSyl.length; i += 1) {
      const a = inputSyl[i];
      const b = vocabSyl[i];
      if (a === b) continue;
      mismatches += 1;
      if (mismatches > 1) {
        ok = false;
        break;
      }
      if (editDistanceOne(a, b)) continue;
      if (confusionMatch(a, b)) continue;
      ok = false;
      break;
    }
    if (ok && mismatches > 0) suggestions.add(vocab);
  }
  return Array.from(suggestions).slice(0, 3);
}
