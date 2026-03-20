# FSRS Notes (ts-fsrs)

## What is ts-fsrs
A TypeScript implementation of the Free Spaced Repetition Scheduler (FSRS). It computes the next review time for each item based on performance.

## Why we use it
- Provides adaptive scheduling for vocab/grammar drills.
- Better than fixed intervals or counters.
- Supplies per-item "next due" times based on learner accuracy.

## Key behaviors to verify
1. Rating "Good" moves the due date forward.
2. Rating "Again" keeps the due date closer.
3. Repeated successes increase interval lengths.
4. New cards always get a valid next due date.

## Parameters we set
- enable_fuzz: false
- enable_short_term: false

## What to test when adjusting parameters
- "Again" schedules soon (minutes/hours, not days).
- "Good" increases interval over time.
- If fuzzing enabled, intervals stay within acceptable range.
