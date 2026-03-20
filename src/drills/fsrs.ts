import { Card, createEmptyCard, fsrs, generatorParameters, Rating } from "ts-fsrs";

const params = generatorParameters({ enable_fuzz: false, enable_short_term: false });
const engine = fsrs(params);

export function createNewCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

export function scheduleWithRating(card: Card, rating: Rating, now: Date = new Date()): Card {
  const record = engine.next(card, now, rating);
  return record.card;
}
