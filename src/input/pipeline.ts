import { loadCurriculumFromFile } from "../curriculum/loader";
import { Curriculum, CurriculumItem } from "../curriculum/types";
import { normalizeInput } from "./normalize";
import { loadCandidateIndexFromSeed, resolveCandidatesFromPinyin } from "./candidate_resolver";
import { suggestCloseMatchesBySyllable } from "./correction";
import { NormalizedInput, Token } from "./types";

export type EnglishHint = {
  english: string;
  hanzi: string;
  pinyin: string;
};

export type InputPipelineResult = {
  normalized: NormalizedInput;
  candidates: string[];
  corrections: string[];
  englishHints: EnglishHint[];
};

const ENGLISH_STOPWORDS = new Set([
  "i",
  "you",
  "me",
  "my",
  "your",
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "do",
  "does",
  "what",
  "how",
  "why",
  "is",
  "are",
  "am"
]);

function stripToneNumbers(pinyin: string): string {
  return pinyin.replace(/[1-5]/g, "");
}

function buildPinyinVocabulary(curriculum: Curriculum): string[] {
  const vocab: string[] = [];
  for (const unit of curriculum.units) {
    const items = [...unit.vocab, ...unit.phrases, ...unit.templates];
    for (const item of items) {
      vocab.push(stripToneNumbers(item.pinyin.toLowerCase().trim()));
    }
  }
  return Array.from(new Set(vocab)).filter(Boolean);
}

function buildEnglishMap(curriculum: Curriculum): Map<string, CurriculumItem> {
  const map = new Map<string, CurriculumItem>();
  for (const unit of curriculum.units) {
    const items = [...unit.vocab, ...unit.phrases, ...unit.templates];
    for (const item of items) {
      const key = item.english.toLowerCase().trim();
      if (key && !map.has(key)) {
        map.set(key, item);
      }
    }
  }
  return map;
}

function ngrams(words: string[], maxLen: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < words.length; i += 1) {
    for (let len = 1; len <= maxLen && i + len <= words.length; len += 1) {
      out.push(words.slice(i, i + len).join(" "));
    }
  }
  return out;
}

function extractEnglishPhrases(tokens: Token[]): string[] {
  const phrases: string[] = [];
  let buffer: string[] = [];

  function flush(): void {
    if (buffer.length) {
      const words = buffer.filter((w) => w.trim() !== "");
      if (words.length) {
        phrases.push(...ngrams(words, 3));
      }
      buffer = [];
    }
  }

  for (const token of tokens) {
    if (token.type === "latin") {
      buffer.push(token.raw.toLowerCase());
      continue;
    }
    if (token.type === "whitespace") {
      if (buffer.length) buffer.push(" ");
      continue;
    }
    flush();
  }
  flush();

  return phrases.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
}

function shouldHintEnglish(phrase: string): boolean {
  const words = phrase.split(" ").filter(Boolean);
  if (words.length === 1 && ENGLISH_STOPWORDS.has(words[0])) return false;
  if (words.length === 1 && words[0].length < 3) return false;
  return true;
}

export function runInputPipeline(input: string): InputPipelineResult {
  const normalized = normalizeInput(input);
  const index = loadCandidateIndexFromSeed();
  const candidates = resolveCandidatesFromPinyin(normalized.canonicalPinyin, index);

  const curriculum = loadCurriculumFromFile("docs/curriculum_seed.md");
  const vocab = buildPinyinVocabulary(curriculum);
  const correctionInput = stripToneNumbers(normalized.canonicalPinyin);
  const corrections = correctionInput ? suggestCloseMatchesBySyllable(correctionInput, vocab) : [];

  const englishMap = buildEnglishMap(curriculum);
  const englishPhrases = extractEnglishPhrases(normalized.tokens);
  const englishHints: EnglishHint[] = [];
  for (const phrase of englishPhrases) {
    if (!shouldHintEnglish(phrase)) continue;
    const item = englishMap.get(phrase);
    if (item) {
      englishHints.push({ english: item.english, hanzi: item.hanzi, pinyin: item.pinyin });
    }
  }

  return { normalized, candidates, corrections, englishHints };
}
