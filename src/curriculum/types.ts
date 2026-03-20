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

export type CurriculumUnit = {
  title: string;
  topic: string;
  level: string;
  vocab: CurriculumItem[];
  phrases: CurriculumItem[];
  templates: CurriculumItem[];
  grammar: GrammarItem[];
};

export type Curriculum = {
  units: CurriculumUnit[];
};
