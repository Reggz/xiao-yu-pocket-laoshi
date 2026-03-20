export type SessionRecap = {
  correct: string[];
  errors: string[];
  newVocab: string[];
  nextDue: string[];
};

export function buildRecap(recap: SessionRecap): string {
  const lines = [
    `Correct: ${recap.correct.join(", ") || "-"}`,
    `Errors: ${recap.errors.join(", ") || "-"}`,
    `New vocab: ${recap.newVocab.join(", ") || "-"}`,
    `Next due: ${recap.nextDue.join(", ") || "-"}`
  ];
  return lines.join("\n");
}
