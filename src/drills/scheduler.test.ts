import { describe, it, expect } from "vitest";
import { pickDueItems } from "./scheduler";
import { createNewCard, scheduleWithRating } from "./fsrs";
import { Rating } from "ts-fsrs";

describe("drill scheduler", () => {
  it("picks due items", () => {
    const now = Date.now();
    const items = [
      { id: "a", dueAt: now - 1000 },
      { id: "b", dueAt: now + 1000 },
      { id: "c", dueAt: now - 500 }
    ];
    const due = pickDueItems(items, now, 2);
    expect(due.length).toBe(2);
    expect(due[0].id).toBe("a");
  });

  it("schedules next review with fsrs", () => {
    const card = createNewCard(new Date());
    const updated = scheduleWithRating(card, Rating.Good, new Date());
    expect(updated.due.getTime()).toBeGreaterThan(Date.now() - 1000);
  });
});
