export type DrillItem = {
  id: string;
  dueAt: number;
};

export function pickDueItems(items: DrillItem[], nowMs: number, limit: number): DrillItem[] {
  const due = items.filter((i) => i.dueAt <= nowMs);
  return due.sort((a, b) => a.dueAt - b.dueAt).slice(0, limit);
}
