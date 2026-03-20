import { Token } from "./types";

const HANZI_RE = /[\u4e00-\u9fff]/;

function isHanzi(ch: string): boolean {
  return HANZI_RE.test(ch);
}

function isLetter(ch: string): boolean {
  return /\p{L}/u.test(ch);
}

function isDigit(ch: string): boolean {
  return /\d/.test(ch);
}

function isWhitespace(ch: string): boolean {
  return /\s/.test(ch);
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (isWhitespace(ch)) {
      let j = i + 1;
      while (j < input.length && isWhitespace(input[j])) j += 1;
      tokens.push({ raw: input.slice(i, j), type: "whitespace" });
      i = j;
      continue;
    }

    if (isHanzi(ch)) {
      let j = i + 1;
      while (j < input.length && isHanzi(input[j])) j += 1;
      tokens.push({ raw: input.slice(i, j), type: "hanzi" });
      i = j;
      continue;
    }

    if (isLetter(ch)) {
      let j = i + 1;
      while (j < input.length && (isLetter(input[j]) || isDigit(input[j]))) j += 1;
      tokens.push({ raw: input.slice(i, j), type: "latin" });
      i = j;
      continue;
    }

    if (isDigit(ch)) {
      let j = i + 1;
      while (j < input.length && isDigit(input[j])) j += 1;
      tokens.push({ raw: input.slice(i, j), type: "number" });
      i = j;
      continue;
    }

    tokens.push({ raw: ch, type: "symbol" });
    i += 1;
  }

  return tokens;
}
