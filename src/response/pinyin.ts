const TONE_MARKS: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  "ü": ["ǖ", "ǘ", "ǚ", "ǜ"]
};

const MARK_TO_TONE: Record<string, number> = {
  "ā": 1,
  "á": 2,
  "ǎ": 3,
  "à": 4,
  "ē": 1,
  "é": 2,
  "ě": 3,
  "è": 4,
  "ī": 1,
  "í": 2,
  "ǐ": 3,
  "ì": 4,
  "ō": 1,
  "ó": 2,
  "ǒ": 3,
  "ò": 4,
  "ū": 1,
  "ú": 2,
  "ǔ": 3,
  "ù": 4,
  "ǖ": 1,
  "ǘ": 2,
  "ǚ": 3,
  "ǜ": 4
};

const TONE_MARK_RE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

function hasToneMarks(input: string): boolean {
  return TONE_MARK_RE.test(input);
}

function normalizeUmlaut(input: string): string {
  return input.replace(/u:/gi, "ü").replace(/v/gi, "ü");
}

function applyToneToSyllable(raw: string, tone: number): string {
  const original = raw;
  const normalized = normalizeUmlaut(raw);
  const lower = normalized.toLowerCase();
  if (tone <= 0 || tone === 5) {
    return normalized;
  }

  let vowelIndex = -1;
  if (lower.includes("a")) {
    vowelIndex = lower.indexOf("a");
  } else if (lower.includes("e")) {
    vowelIndex = lower.indexOf("e");
  } else if (lower.includes("ou")) {
    vowelIndex = lower.indexOf("o");
  } else {
    for (let i = lower.length - 1; i >= 0; i -= 1) {
      const ch = lower[i];
      if (ch === "a" || ch === "e" || ch === "i" || ch === "o" || ch === "u" || ch === "ü") {
        vowelIndex = i;
        break;
      }
    }
  }

  if (vowelIndex === -1) {
    return normalized;
  }

  const vowel = lower[vowelIndex] as keyof typeof TONE_MARKS;
  const marked = TONE_MARKS[vowel][tone - 1];
  let result = lower.slice(0, vowelIndex) + marked + lower.slice(vowelIndex + 1);

  if (original[0] && original[0] === original[0].toUpperCase()) {
    result = result[0].toUpperCase() + result.slice(1);
  }

  return result;
}

export function toToneMarks(pinyin: string): string {
  if (!pinyin) return pinyin;
  if (hasToneMarks(pinyin)) return pinyin;

  return pinyin.replace(/([A-Za-züÜv:]+)([1-5])/g, (_, syllable: string, tone: string) => {
    return applyToneToSyllable(syllable, Number(tone));
  });
}

export function extractToneNumber(pinyin: string): string | null {
  const digitMatch = pinyin.match(/[1-5]/);
  if (digitMatch) return digitMatch[0];
  for (const ch of pinyin) {
    const tone = MARK_TO_TONE[ch];
    if (tone) return String(tone);
  }
  return null;
}

export function formatPinyinLine(line: string): string {
  if (!line) return line;
  return toToneMarks(line);
}
