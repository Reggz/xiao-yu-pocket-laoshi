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
- missingTone is tracked for tone-less pinyin inputs.
- Grammar tiers: critical, core, advanced with max one non-critical per response.
- Close-match correction layer before disambiguation.
- Incorrect characters trigger gentle correction with explanation.
- Auto-hints appear for new items and include English gloss + pinyin.
- Spaced repetition via ts-fsrs.
- Sessions are short micro-conversations (few back-and-forth turns).
- Session windows: 06:00-12:00, 12:00-18:00, 18:00-24:00 local time.
- Default bot check-in times: 08:00, 15:00, 21:30 local time.
- Safety boundaries: block or redirect sexual content, hate, harassment, and explicit profanity.
- Optional onboarding placement to set starting level.
- Topic-based learning with 1-3 user-selected topics.
- Observability required in v1: logs for requests, errors, LLM cost, latency, safety events, and correction events with trace IDs.
- Fixes A-D applied: disambiguation via inline buttons, grammar guardrails, exploratory usage_count, conversation buffer with token cap.

## 4. Technical Constraints
- Language: TypeScript.
- Telegram: grammY.
- Database: Postgres (Supabase optional).
- Hosting: Vercel with explicit cron/scheduler strategy.
- Libraries: pinyin-pro, ts-fsrs.
- System requirements: provider-agnostic LLM interface, LLM timeout handling, rate limiting, prompt/cost logging, scheduler required.

## 5. Current Artifacts
- PRD: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/PRD.md`
- Architecture: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/architecture.md`
- Data Model: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/data_model.md`
- Interaction Rules: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/interaction_rules.md`
- Curriculum Seed: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/curriculum_seed.md`
- Implementation Plan: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/implementation_plan.md`
- Testing Plan: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/testing_plan.md`
- Traceability: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/traceability.md`
- Consistency Checklist: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/consistency_checklist.md`
- Testing Manual: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/testing_manual.md`
- Deployment Plan: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/deployment_plan.md`
- Observability: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/observability.md`
- FSRS Notes: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/fsrs_notes.md`
- Brand: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/brand.md`

## 6. Open Questions
- Scheduler defaults (times, quiet hours) and user customization UI.
- LLM provider choice and cost budget.
- Mastery thresholds for level progression.
- Billing and subscription flow details (provider, tiers, trial rules).

## 7. Next Steps
- Continue build from Phase 13 (deployment prep).
- Run tests after each phase.

## 8. Decision Log (Detailed)
- Brand: Xiao Yu (小语), tagline "Your Pocket Lao Shi", tone encouraging/witty/informal, no "vibe" wording.
- Levels are internal only; user-facing copy avoids A0/A1 labels.
- Input types supported: hanzi, pinyin with tone numbers, pinyin with tone marks, pinyin without tones, mixed English.
- missingTone flag added for tone-less pinyin to guide downstream corrections.
- Disambiguation state includes pending input, candidates, timestamp, and expiry TTL.
- Disambiguation uses inline keyboard buttons; numeric replies bypass normalization when awaiting selection.
- Close-match correction layer added before disambiguation using confusion groups + edit distance.
- Confusion groups expanded (z/zh, c/ch, s/sh, j/zh, q/ch, x/sh, n/ng, l/r, an/ang, en/eng, in/ing, ian/iang, uan/uang, u/ü, ue/üe).
- Grammar tiers: critical/core/advanced; allow max one non-critical grammar per response.
- Grammar guardrails validate output (not only prompt).
- Curriculum seed is the source of truth in v1; manual updates to docs/curriculum_seed.md.
- Curriculum units include Level and Grammar sections; grammar items carry tier.
- Candidate resolver builds pinyin→hanzi index from curriculum vocab/phrases/templates.
- Topic routing uses coarse unit-level tags; items inherit tags.
- Topic bias ratio configurable (default 0.7); fallback to general content if topic pool thin.
- Topic selection limited to 1–3 active topics.
- Session windows: 06:00–12:00, 12:00–18:00, 18:00–24:00.
- Default check-in times: 08:00, 15:00, 21:30.
- If user initiates in a window, bot skips that window’s check-in.
- Event-based ping: if no interaction by evening, send micro-drill teaser.
- Session length is short; turn count configurable.
- Safety: block/redirect sexual content, hate, harassment, explicit profanity.
- LLM strategy: hybrid; template-first, LLM fallback; throttle LLM usage; fallback when over budget.
- Conversation buffer: last 3–5 interactions with token budget; drop excess.
- Observability required in v1: log requests, errors, LLM cost, latency, safety events, correction events; include trace IDs.
- Tests required: unit tests for input, curriculum, disambiguation, correction, guardrails, throttling; manual testing deferred to UAT.
- Deployment plan created; LLM real integration explicitly added as Phase 12A.
- Runtime gaps closed: wired /menu and /topics commands, added topic bias handling in template selection, English auto-hints now derived from curriculum glosses, and added DB persistence adapter for interactions.
- LLM integration decision: default provider OpenAI with model gpt-4.1-mini, provider switch via LLM_PROVIDER/LLM_MODEL and optional LLM_BASE_URL.
- Admin override: LLM_DISABLE_CAPS can disable throttling for exploratory testing.
- Phase 12A completed: real LLM adapter wired into response engine with template fallback, throttling, and provider switch config.
- Phase 12B completed: response engine integrated end-to-end with LLM policy manager, caps override, and bot flow updated.
- Onboarding gate added: /start sets onboarding state, /done or /skip unlocks normal chat; LLM use is blocked until onboarding complete.
- Webhook de-dup added using update_id TTL to prevent duplicate replies.
