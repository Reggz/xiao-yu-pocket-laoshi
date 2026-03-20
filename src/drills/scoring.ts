export type Mode = "mcq" | "fill_blank" | "tone_selection" | "free_text";

const MODE_WEIGHTS: Record<Mode, number> = {
  mcq: 1.0,
  fill_blank: 1.0,
  tone_selection: 1.0,
  free_text: 0.4
};

export function getModeWeight(mode: Mode): number {
  return MODE_WEIGHTS[mode] ?? 0.4;
}
