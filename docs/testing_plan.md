# Testing Plan

## Unit Tests (Phase 7 Focus)
- Template fallback when LLM fails.
- Grammar guardrail validation (critical vs non-critical).
- Conversation buffer truncation (max turns + token cap).
- LLM throttling (budget exceeded).
- Candidate resolver (tone and plain pinyin).
- Disambiguation state machine.
- Close-match correction (confusion pairs).
- Response engine LLM integration (fallback vs LLM).
- LLM manager cap bypass for admins.

## Manual Tests
See: docs/testing_manual.md

## UAT / Final Testing
- Run end-to-end bot flow with real LLM enabled.
- Verify fallback behavior when LLM fails or is throttled.
- Validate grammar guardrails + disambiguation + correction in live chat.
- Confirm logs record LLM calls, latency, and fallback reasons.

## Onboarding + De-dup Checks
- Verify `/start` triggers onboarding instructions.
- Verify `/done` or `/skip` unlocks normal chat.
- Verify update_id de-dup avoids duplicate replies when webhook retries.

## Pause/Reset Checks
- /pause stops replies and prevents LLM calls.
- /resume restores normal chat.
- /reset clears session state and requires /start.
