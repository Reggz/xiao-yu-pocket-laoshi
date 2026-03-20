# PROJECT_BOOTSTRAP_PROMPT.md

You are continuing the Xiao Yu (小语) project.

## Purpose
Telegram bot for English speakers learning Mandarin. Text-first, level-gated, topic-aware. Deterministic pipeline first; LLM is optional and controlled.

## Quick Repo Map
- docs/: PRD, architecture, data_model, interaction_rules, testing plans
- src/: implementation
  - input/: tokenizer, normalization, disambiguation, correction, candidate resolver
  - curriculum/: loader, helpers, types
  - response/: templates, grammar guardrails, conversation buffer
  - llm/: adapter + throttling
  - drills/: fsrs wrapper + scheduler + scoring
  - scheduler/: session windows + check-ins
  - summary/: recap builder
  - observability/: logger
  - bot/: menu options
  - onboarding/: placement + topics

## Core Flow (Simplified)
Input → tokenize → normalize → candidate resolver → correction → disambiguation → curriculum → template/LLM → grammar guardrails → buffer → output.

## Key Decisions
- Levels are internal only.
- Input supports hanzi + pinyin (tone marks/numbers/plain) + mixed English.
- missingTone flag used for tone-less pinyin.
- Disambiguation uses Telegram inline buttons.
- Grammar tiers: critical/core/advanced; max one non-critical per response.
- Templates first, LLM fallback; throttle LLM usage.
- Sessions: morning/afternoon/evening windows with check-in times 08:00/15:00/21:30.

## Current State
Phases 1–11 are implemented. Real LLM integration (Phase 12A) and full end-to-end wiring (Phase 12B) are still pending.

## Start Here
Read `PROJECT_CONTEXT.md` for full detail after this.
