# Traceability Matrix (Requirements → Code → Tests)

## Input Processing
- PRD: Input formats (pinyin tones/marks/plain, hanzi, mixed)
- Code: src/input/tokenize.ts, src/input/normalize.ts
- Tests: src/input/tokenize.test.ts, src/input/normalize.test.ts

- PRD: missingTone tracking
- Code: src/input/normalize.ts, src/input/types.ts
- Tests: src/input/normalize.test.ts

## Disambiguation
- PRD: disambiguation with inline buttons
- Code: src/input/disambiguation.ts (state machine), src/bot.ts
- Tests: src/input/disambiguation.test.ts

## Close-match correction
- PRD: correction before disambiguation
- Code: src/input/correction.ts
- Tests: src/input/correction.test.ts

## Candidate Resolver
- PRD/Architecture: candidate lookup from curriculum
- Code: src/input/candidate_resolver.ts, src/input/pipeline.ts
- Tests: src/input/candidate_resolver.test.ts

## Curriculum
- PRD: seed as source of truth
- Code: src/curriculum/loader.ts, helpers.ts
- Tests: src/curriculum/loader.test.ts, helpers.test.ts

## Grammar Guardrails
- PRD: grammar tiers, max one non-critical
- Code: src/response/grammar.ts, src/response/llm.ts
- Tests: src/response/grammar.test.ts, src/response/llm.test.ts

## Template Engine
- PRD: template-first fallback + topic bias
- Code: src/response/templates.ts, src/response/engine.ts
- Tests: src/response/templates.test.ts, src/response/engine.test.ts

## LLM Adapter
- PRD: model-agnostic interface + provider switching
- Code: src/llm/adapter.ts, src/llm/factory.ts, src/llm/openai.ts
- Tests: src/llm/adapter.test.ts

## LLM Throttling + Admin Override
- PRD: cost controls + admin cap override
- Code: src/llm/throttle.ts, src/llm/manager.ts, src/response/engine.ts
- Tests: src/llm/throttle.test.ts, src/llm/manager.test.ts, src/response/engine.test.ts

## Conversation Buffer
- PRD: last 3–5 interactions + token cap
- Code: src/response/buffer.ts, src/response/engine.ts
- Tests: src/response/buffer.test.ts

## Auto-hints
- PRD: auto-hints for new vocab + corrections
- Code: src/response/hints.ts, src/input/pipeline.ts, src/bot.ts
- Tests: src/input/pipeline.test.ts, src/response/hints.test.ts

## Scheduling
- PRD: session windows + check-in rules
- Code: src/scheduler/windows.ts, checkins.ts, runner.ts
- Tests: src/scheduler/windows.test.ts, checkins.test.ts, runner.test.ts

## Drill Scheduling
- PRD: spaced repetition (ts-fsrs)
- Code: src/drills/fsrs.ts, scheduler.ts
- Tests: src/drills/fsrs.test.ts, scheduler.test.ts

## Scoring Weights
- PRD: mode-specific weights
- Code: src/drills/scoring.ts
- Tests: src/drills/scoring.test.ts

## Session Summary
- PRD: recap format
- Code: src/summary/recap.ts
- Tests: src/summary/recap.test.ts

## Observability
- PRD: logs with trace IDs
- Code: src/observability/logger.ts
- Tests: src/observability/logger.test.ts

## Onboarding
- PRD: placement + topic selection
- Code: src/onboarding/placement.ts, topics.ts
- Tests: placement.test.ts, topics.test.ts

## Menu Navigation
- PRD: menu with options
- Code: src/bot/menu.ts, src/bot.ts
- Tests: src/bot/menu.test.ts

## Persistence
- PRD/Data Model: interaction logging
- Code: src/storage/db.ts
- Tests: (requires integration test with DB)

## Pending (Not Implemented Yet)
- Deployment (Phase 13)
