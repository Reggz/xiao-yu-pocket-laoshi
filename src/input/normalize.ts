import { NormalizedInput, Token } from "./types";
import { tokenize } from "./tokenize";

const TONE_MARKS: Record<string, { base: string; tone: number }> = {
  "ā": { base: "a", tone: 1 },
  "á": { base: "a", tone: 2 },
  "ǎ": { base: "a", tone: 3 },
  "à": { base: "a", tone: 4 },
  "ē": { base: "e", tone: 1 },
  "é": { base: "e", tone: 2 },
  "ě": { base: "e", tone: 3 },
  "è": { base: "e", tone: 4 },
  "ī": { base: "i", tone: 1 },
  "í": { base: "i", tone: 2 },
  "ǐ": { base: "i", tone: 3 },
  "ì": { base: "i", tone: 4 },
  "ō": { base: "o", tone: 1 },
  "ó": { base: "o", tone: 2 },
  "ǒ": { base: "o", tone: 3 },
  "ò": { base: "o", tone: 4 },
  "ū": { base: "u", tone: 1 },
  "ú": { base: "u", tone: 2 },
  "ǔ": { base: "u", tone: 3 },
  "ù": { base: "u", tone: 4 },
  "ǖ": { base: "ü", tone: 1 },
  "ǘ": { base: "ü", tone: 2 },
  "ǚ": { base: "ü", tone: 3 },
  "ǜ": { base: "ü", tone: 4 }
};

const PINYIN_SYLLABLES = new Set([
  "ni",
  "hao",
  "ma",
  "wo",
  "jiao",
  "ming",
  "zi",
  "chi",
  "he",
  "mi",
  "fan",
  "mian",
  "tiao",
  "shui",
  "cha",
  "ka",
  "fei",
  "jin",
  "tian",
  "zao",
  "shang",
  "xia",
  "wu",
  "wan",
  "zuo",
  "qu",
  "na",
  "li",
  "you",
  "ge",
  "ji",
  "peng",
  "zai",
  "zhe",
  "dao",
  "xi",
  "huan",
  "bu",
  "xiang",
  "yao",
  "gong",
  "si",
  "lao",
  "shi",
  "xue",
  "sheng",
  "tong",
  "tian",
  "qi",
  "re",
  "leng",
  "hen"
]);

function toToneNumber(syllable: string): string {
  let tone = 0;
  let output = "";
  for (const ch of syllable) {
    const mapped = TONE_MARKS[ch];
    if (mapped) {
      tone = mapped.tone;
      output += mapped.base;
    } else {
      output += ch;
    }
  }
  return tone > 0 ? `${output}${tone}` : output;
}

function splitToneNumberPinyin(token: string): string[] | null {
  const parts = token.match(/[a-zü]+[1-5]/gi);
  if (!parts || parts.join("").toLowerCase() !== token.toLowerCase()) return null;
  return parts.map((p) => p.toLowerCase());
}

function splitPlainPinyin(token: string): string[] | null {
  const lower = token.toLowerCase();
  const result: string[] = [];
  let i = 0;
  while (i < lower.length) {
    let matched = false;
    for (let len = Math.min(6, lower.length - i); len >= 1; len -= 1) {
      const part = lower.slice(i, i + len);
      if (PINYIN_SYLLABLES.has(part)) {
        result.push(part);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) return null;
  }
  return result;
}

function normalizeLatinToken(token: Token): { tokens: Token[]; pinyinParts: string[]; missingTone: boolean } {
  const raw = token.raw;
  const lower = raw.toLowerCase();

  if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(lower)) {
    const pinyin = lower
      .split(/\s+/)
      .filter(Boolean)
      .map((s: string) => toToneNumber(s))
      .join(" ");
    return {
      tokens: [{ raw, type: "pinyin_mark" }],
      pinyinParts: pinyin.split(/\s+/),
      missingTone: false
    };
  }

  const toneParts = splitToneNumberPinyin(lower);
  if (toneParts) {
    return {
      tokens: [{ raw, type: "pinyin_number" }],
      pinyinParts: toneParts,
      missingTone: false
    };
  }

  const plainParts = splitPlainPinyin(lower);
  if (plainParts) {
    return {
      tokens: [{ raw, type: "pinyin_plain" }],
      pinyinParts: plainParts,
      missingTone: true
    };
  }

  return { tokens: [{ raw, type: "latin" }], pinyinParts: [], missingTone: false };
}

export function normalizeInput(input: string): NormalizedInput {
  const rawTokens = tokenize(input);
  const tokens: Token[] = [];
  const pinyinParts: string[] = [];
  const hanziParts: string[] = [];
  let missingTone = false;

  for (const token of rawTokens) {
    if (token.type === "hanzi") {
      tokens.push(token);
      hanziParts.push(token.raw);
      continue;
    }

    if (token.type === "latin") {
      const normalized = normalizeLatinToken(token);
      tokens.push(...normalized.tokens);
      pinyinParts.push(...normalized.pinyinParts);
      if (normalized.missingTone) missingTone = true;
      continue;
    }

    tokens.push(token);
  }

  return {
    tokens,
    canonicalPinyin: pinyinParts.join(" "),
    hanzi: hanziParts.join(""),
    missingTone
  };
}
