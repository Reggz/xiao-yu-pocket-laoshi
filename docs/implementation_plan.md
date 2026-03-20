# Implementation Plan (Bite-Sized, Testable)

Each phase is ~15–30 minutes of agent work and ends with a concrete, reviewable output. We execute one phase at a time.

## Phase 1A: Repo Scaffold
- Create Node/TypeScript structure.
- Output: folders + basic tsconfig.

## Phase 1B: Config and Env Validation
- Add config loader and required env checks.
- Output: config module + README quickstart.

## Phase 2A: Telegram Bot Entrypoint
- Create bot entrypoint and basic wiring.
- Output: bot starts without errors.

## Phase 2B: Health Check Command
- Implement /ping.
- Output: bot responds to /ping locally.

## Phase 3A: Core DB Schema
- Create schema for users, user_settings, topics, user_topics, interactions.
- Output: migration files.

## Phase 3B: Exploratory Tracking Fields
- Add usage_count and last_triggered_at to exploratory_items.
- Output: migration update + schema review.

## Phase 4A: Curriculum Loader
- Load curriculum seed from file.
- Output: parser returns units/items.

## Phase 4B: Level/Topic Helpers
- Implement unit/topic tagging and level gating helper.
- Output: unit/vocab lookup tests.

## Phase 5A: Placement Flow (Skippable)
- Add onboarding placement sequence.
- Output: placement flow handler with mock results.

## Phase 5B: Topic Selection
- Implement 1–3 topic selection.
- Output: topics stored in user settings.

## Phase 5C: Menu Navigation
- Implement `menu` command + basic options.
- Output: menu responses wired.

## Phase 6A: Input Type Detection
- Detect pinyin with/without tone, hanzi, mixed.
- Output: detection tests.

## Phase 6B: Canonical Normalization
- Normalize to hanzi + pinyin.
- Output: normalization tests.

## Phase 6C: Disambiguation State
- Add disambiguation state + inline keyboard buttons.
- Output: candidate selection flow test.

## Phase 6D: Close-Match Correction
- Add phonetic similarity correction before disambiguation.
- Use confusion groups and edit-distance checks against curriculum vocab.
- Output: correction suggestion tests.

## Phase 7A: Template Response Engine
- Template-based replies within level.
- Output: deterministic response tests.

## Phase 7B: LLM Adapter
- LLM interface with timeout handling and output validation.
- Output: mocked LLM test.

## Phase 7C: Grammar Guardrails
- Enforce grammar_patterns whitelist; avoid complex conjunctions.
- Output: prompt rules test.

## Phase 7D: Conversation Buffer
- Use last 3–5 interactions with token cap.
- Output: buffer retrieval and truncation test.

## Phase 7E: LLM Throttling
- Throttle LLM usage; fallback to templates when over budget.
- Output: budget fallback test.

## Phase 8: Auto-Hint and Correction
- Detect unknown items/incorrect chars.
- Attach auto-hint with explanation.
- Output: hint generation tests.

## Phase 9A: Session Windows
- Implement 3 daily windows.
- Output: window selection tests.

## Phase 9B: Check-in Rules
- Enforce user-initiated vs bot-initiated rule per window.
- Output: check-in decision tests.

## Phase 10A: Drill Queue
- Implement ts-fsrs scheduling.
- Output: due-item selection tests.

## Phase 10B: Scoring Weights
- Apply mode-specific weights.
- Output: scoring update tests.

## Phase 11A: Session Summary
- Generate recap (correct/errors/new items).
- Output: summary samples.

## Phase 11B: Observability Logs
- Emit logs with trace IDs.
- Output: log sample.

## Phase 12A: LLM Integration (Real Provider)
- Wire adapter to chosen LLM provider.
- Confirm timeouts and error handling.
- Output: real LLM call path tested.

## Phase 12B: Integration Pass
- Wire components end-to-end.
- Output: message in -> response out.

## Phase 13: Deployment Prep
- Vercel config + cron strategy.
- Output: deployable build.
- Reference: docs/deployment_plan.md
