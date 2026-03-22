import { normalizeInput } from "../input/normalize";

export type PlacementQuestion = {
  id: string;
  level: string;
  prompt: string;
  expectedKeywords: string[];
};

export const placementQuestions: PlacementQuestion[] = [
  {
    id: "q1",
    level: "A0",
    prompt: "Translate: Hello, I am [Name].",
    expectedKeywords: ["wo jiao", "wo shi"]
  },
  {
    id: "q2",
    level: "A1",
    prompt: "How do you say: I want to drink coffee?",
    expectedKeywords: ["wo yao he ka fei", "wo yao he kafei", "wo xiang he ka fei"]
  },
  {
    id: "q3",
    level: "A1+",
    prompt: "Translate: I ate 3 bowls of rice yesterday.",
    expectedKeywords: ["wo zuo tian chi", "san", "fan", "wan"]
  },
  {
    id: "q4",
    level: "A2",
    prompt: "Use 把 or 着 in a short sentence.",
    expectedKeywords: ["ba", "zhe"]
  },
  {
    id: "q5",
    level: "B1",
    prompt: "Short story: ... What happened?",
    expectedKeywords: ["le", "guo"]
  }
];

export function getPlacementQuestion(index: number): PlacementQuestion | null {
  if (index < 0 || index >= placementQuestions.length) return null;
  return placementQuestions[index];
}

export function evaluatePlacementAnswer(answer: string, expected: string[]): boolean {
  const normalized = normalizeInput(answer);
  const pinyin = normalized.canonicalPinyin.toLowerCase();
  const raw = answer.toLowerCase();
  return expected.some((k) => pinyin.includes(k) || raw.includes(k));
}

export function scorePlacement(correctCount: number): string {
  if (correctCount <= 1) return "A0";
  if (correctCount <= 3) return "A1";
  return "A2";
}
