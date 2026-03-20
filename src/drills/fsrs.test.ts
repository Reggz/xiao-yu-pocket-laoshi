import { describe, it, expect } from "vitest";
import { createNewCard, scheduleWithRating } from "./fsrs";
import { Rating } from "ts-fsrs";

describe("fsrs sanity", () => {
  it("schedules again sooner than good", () => {
    const now = new Date();
    const card = createNewCard(now);
    const good = scheduleWithRating(card, Rating.Good, now);
    const again = scheduleWithRating(card, Rating.Again, now);
    expect(again.due.getTime()).toBeLessThan(good.due.getTime());
  });

  it("easy extends interval", () => {
    const now = new Date();
    const card = createNewCard(now);
    const good = scheduleWithRating(card, Rating.Good, now);
    const easy = scheduleWithRating(card, Rating.Easy, now);
    expect(easy.due.getTime()).toBeGreaterThan(good.due.getTime());
  });
});
