export type PlacementQuestion = {
  id: string;
  level: string;
  prompt: string;
};

export const placementQuestions: PlacementQuestion[] = [
  { id: "q1", level: "A0", prompt: "Translate: Hello, I am [Name]." },
  { id: "q2", level: "A1", prompt: "How do you say 'I want to drink coffee'?" },
  { id: "q3", level: "A1+", prompt: "I ate 3 bowls of rice yesterday." },
  { id: "q4", level: "A2", prompt: "Use 把 or 着 in a short sentence." },
  { id: "q5", level: "B1", prompt: "Short story: ... What happened?" }
];

export function getPlacementQuestion(index: number): PlacementQuestion | null {
  if (index < 0 || index >= placementQuestions.length) return null;
  return placementQuestions[index];
}

export function scorePlacement(correctCount: number): string {
  if (correctCount <= 1) return "A0";
  if (correctCount <= 3) return "A1";
  return "A2";
}
