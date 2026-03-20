export type TokenType =
  | "hanzi"
  | "pinyin_mark"
  | "pinyin_number"
  | "pinyin_plain"
  | "latin"
  | "number"
  | "whitespace"
  | "symbol";

export type Token = {
  raw: string;
  type: TokenType;
};

export type NormalizedInput = {
  tokens: Token[];
  canonicalPinyin: string;
  hanzi: string;
  missingTone: boolean;
};
