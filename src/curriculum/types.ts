export type CurriculumItem = {
  hanzi: string;
  pinyin: string;
  english: string;
};

export type GrammarTier = "critical" | "core" | "advanced";

export type GrammarItem = {
  hanzi: string;
  pinyin: string;
  english: string;
  tier: GrammarTier;
};

export type ReplyPair = {
  promptHanzi: string;
  replyHanzi: string;
  rationale?: string;
};

export type CurriculumUnit = {
  title: string;
  topic: string;
  level: string;
  vocab: CurriculumItem[];
  phrases: CurriculumItem[];
  templates: CurriculumItem[];
  grammar: GrammarItem[];
  replyPairs: ReplyPair[];
};

export type Curriculum = {
  units: CurriculumUnit[];
};
