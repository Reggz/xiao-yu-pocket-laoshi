# Project Memory

## 1. Scope
- Telegram chatbot for English speakers learning Mandarin (A0-A1).
- Text-first: simplified characters, pinyin, English gloss for new items.
- Daily micro-drills + casual chat.

## 2. Non-Goals (v1)
- Audio input or pronunciation scoring.
- Full conversational fluency claims.
- Long-form rigid curriculum.

## 3. Core Decisions
- Level-gated responses using a structured curriculum catalog.
- User input can be pinyin (with/without tones), characters, or mixed English.
- Input normalization converts to canonical (hanzi + pinyin).
- Incorrect characters trigger gentle correction with explanation.
- Auto-hints appear for new items and include English gloss + pinyin.
- Spaced repetition via ts-fsrs.
- Sessions are short micro-conversations (few back-and-forth turns).
- Session windows are morning 06:00-12:00, afternoon 12:00-18:00, evening 18:00-24:00 local time.
- Default bot check-in times are 08:00, 15:00, 21:30 local time.
- Safety boundaries: block or redirect sexual content, hate, harassment, and explicit profanity.
- Optional onboarding placement to set starting level.
- Topic-based learning with 1-3 user-selected topics.
- Feedback from Brainstorm 1.0 incorporated: low-confidence pinyin disambiguation with candidate list.
- Feedback from Brainstorm 1.0 incorporated: Level + 1 exposure with auto-hints.
- Feedback from Brainstorm 1.0 incorporated: event-based ping strategy.
- Feedback from Brainstorm 1.0 incorporated: exploratory vocab curation rule.
- Feedback from Brainstorm 1.0 incorporated: hybrid response engine with cache validation.
- Observability required in v1: logs for requests, errors, LLM cost, latency, safety events, and correction events with trace IDs.
- Fix A–D applied: disambiguation via inline buttons, grammar guardrails, exploratory usage_count, conversation buffer with token cap.

## 4. Technical Constraints
- Language: TypeScript.
- Telegram: grammY.
- Database: Postgres (Supabase optional).
- Hosting: Vercel with explicit cron/scheduler strategy.
- Libraries: pinyin-pro, ts-fsrs.
- System requirements: provider-agnostic LLM interface, LLM timeout handling, rate limiting, prompt/cost logging, scheduler required.

## 5. Current Artifacts
- PRD: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/PRD.md`
- Architecture: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/architecture.md`
- Data Model: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/data_model.md`
- Interaction Rules: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/interaction_rules.md`
- Curriculum Seed: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/curriculum_seed.md`
- Implementation Plan: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/implementation_plan.md`
- Observability: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/observability.md`

## 6. Open Questions
- Scheduler defaults (times, quiet hours) and user customization UI.
- LLM provider choice and cost budget.
- Mastery thresholds for level progression.
- Billing and subscription flow details (provider, tiers, trial rules).

## 7. Next Steps
- Update architecture/data model if new decisions emerge.
- Draft implementation plan and code scaffolding.
