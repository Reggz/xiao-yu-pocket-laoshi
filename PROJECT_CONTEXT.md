# PROJECT_CONTEXT.md

This is the canonical, comprehensive knowledge transfer document for **Xiao Yu (小语) — Pocket Lao Shi**. It consolidates all decisions, requirements, architecture, code structure, testing strategy, and pitfalls. It is intended for continuity across new Codex threads, Claude Code, or human engineers.

The contents are based on the actual repository state, PRD, architecture docs, and code base as of the last update.

---

## 0. Repository Location and Structure

**Project root**:
`/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi`

**Key folders**:
- `docs/` — all product, architecture, and testing documents
- `src/` — TypeScript application code
- `db/migrations/` — SQL migrations
- `PROJECT_CONTEXT.md` — this file

**Important docs**:
- `docs/PRD.md`
- `docs/architecture.md`
- `docs/data_model.md`
- `docs/interaction_rules.md`
- `docs/curriculum_seed.md`
- `docs/implementation_plan.md`
- `docs/testing_plan.md`
- `docs/testing_manual.md`
- `docs/observability.md`
- `docs/deployment_plan.md`
- `docs/PROJECT_MEMORY.md`
- `docs/brand.md`
- `docs/fsrs_notes.md`

---

## 1. Project Overview

### 1.1 What the system does
Xiao Yu is a Telegram-based Mandarin practice bot for English speakers. It provides:
- Casual, real-time conversation practice
- Daily micro-drills (MCQ, fill-in, tone selection)
- Immediate corrections and hints
- Spaced repetition for retention

### 1.2 Core user experience
- User interacts in Telegram, no separate app install.
- User can type:
  - Chinese characters (simplified)
  - Pinyin with tone numbers
  - Pinyin with tone marks
  - Pinyin without tones
  - Mixed Chinese + English
- Bot responds in Mandarin, optionally with English explanation.
- Unknown English words are turned into auto-hints (`炒饭` for “fried rice”).
- Incorrect characters are corrected with an explanation.

### 1.3 Target user
- English-speaking Mandarin learner (A0–A1 in v1)
- International nomads / professionals / students
- Wants flexible, low-friction practice instead of rigid curriculum

### 1.4 Design philosophy
- **Deterministic pipeline before LLM**: Most logic is rule-based.
- **LLM is optional**: Used for naturalness only, not as the primary logic engine.
- **Template-first fallback**: If LLM fails, templates ensure stability.
- **Strict normalization**: Input must be parsed before reasoning.
- **Controlled exposure**: Grammar and vocab exposure are gated.

---

## 2. Brand, Tone, and UX Positioning

### 2.1 Brand
- Name: **Xiao Yu (小语)**
- Tagline: **Your Pocket Lao Shi**
- Mission: reduce fear of speaking with a judgment-free, 24/7 tutor

### 2.2 Tone of voice
- Encouraging
- Witty
- Slightly informal
- Avoid AI-sounding “vibe” language

### 2.3 UX North Star
- Frictionless entry
- One tap to start talking
- No public levels shown; levels exist internally only

---

## 3. Architecture (High-Level)

### 3.1 Pipeline
User input
→ Tokenization
→ Script detection
→ Pinyin normalization
→ Candidate lookup
→ Close-match correction
→ Disambiguation state
→ Curriculum engine
→ Response engine (template or LLM)
→ Grammar guardrails
→ Conversation buffer
→ Output

### 3.2 Why each layer exists
- **Tokenization**: separates hanzi, pinyin, latin, digits, emoji.
- **Script detection**: reduces false positives in normalization.
- **Pinyin normalization**: unifies tone marks, tone numbers, and no-tone input.
- **Candidate lookup**: maps pinyin to hanzi for disambiguation.
- **Close-match correction**: catches learner typos before disambiguation.
- **Disambiguation**: avoids incorrect auto-resolve when ambiguous.
- **Curriculum engine**: enforces level and topic constraints.
- **Response engine**: template-first, LLM fallback.
- **Grammar guardrails**: stop over-complex grammar for beginners.
- **Conversation buffer**: short context without token explosion.

---

## 4. Implementation Phases (Status)

All phases are defined in `docs/implementation_plan.md`. Current state:

**Implemented**
- Phase 1A–1B: Repo + config
- Phase 2A–2B: Bot entry + /ping
- Phase 3A–3B: DB migrations
- Phase 4A–4B: Curriculum loader/helpers
- Phase 5A–5C: Placement + topics + menu options
- Phase 6A–6D: Input processing, disambiguation, correction
- Phase 7A–7E: Templates, LLM adapter, guardrails, buffer, throttling
- Phase 8: Auto-hints/corrections
- Phase 9A–9B: Session windows + check-in rules
- Phase 10A–10B: FSRS + scoring weights
- Phase 11A–11B: Session recap + logger

**Not yet implemented**
- Phase 12A: Real LLM integration
- Phase 12B: Full system integration (end-to-end bot)
- Phase 13: Deployment

---

## 5. Input Processing Engine

### 5.1 Supported inputs
- `ni3 hao3`
- `ni3hao3`
- `ni hao`
- `nihao`
- `Nǐ hǎo`
- `你好`
- `你好 ma`
- `ni hao 吗`
- Mixed Latin names (`wo jiao Sarah`)
- Emoji / symbols

### 5.2 Token types
Defined in `src/input/types.ts`:
- `hanzi`
- `pinyin_mark`
- `pinyin_number`
- `pinyin_plain`
- `latin`
- `number`
- `whitespace`
- `symbol`

### 5.3 Normalization rules
- Tone marks → tone numbers (`Nǐ hǎo` → `ni3 hao3`)
- Glued tone numbers split (`ni3hao3` → `ni3 hao3`)
- Plain pinyin segmented using a syllable set
- `missingTone` flag set if tone-less pinyin detected

### 5.4 Known edge cases handled
- Mixed scripts
- Emoji tokens
- Latin names
- Numbers in sentence

---

## 6. Ambiguity Handling (Disambiguation State)

### 6.1 State machine
- `normal` → ambiguous input → `awaiting_disambiguation` → user choice → `normal`

### 6.2 Inline keyboard
- Candidate selection uses Telegram inline keyboard buttons
- Avoids user typing “1” (which could be mis-normalized)

### 6.3 Expiry and interruption
- TTL default: 5 minutes
- If user ignores disambiguation and sends new input, state is cleared

---

## 7. Close-Match / Typo Correction Layer

### 7.1 Why it exists
Learners confuse similar sounds (zi/zhi, etc.). This layer reduces frustration before disambiguation.

### 7.2 Mechanisms
- Edit distance (<=1)
- Confusion groups:
  - z/zh, c/ch, s/sh
  - j/zh, q/ch, x/sh
  - n/ng, l/r
  - an/ang, en/eng, in/ing
  - ian/iang, uan/uang
  - u/ü, ue/üe

### 7.3 Behavior
- Suggests corrections but **never auto-corrects silently**

---

## 8. Curriculum Engine

### 8.1 Source of truth
`docs/curriculum_seed.md`

### 8.2 Structure
Each unit contains:
- Title
- Topic tag
- Level (A0/A1)
- Vocab
- Phrases
- Templates
- Grammar (with tier)

### 8.3 Grammar tiers
- `critical`
- `core`
- `advanced`

### 8.4 Candidate resolver
Builds pinyin→hanzi index from vocab/phrases/templates.

---

## 9. Response Engine

### 9.1 Template engine
- Deterministic template picker (currently first template)

### 9.2 LLM engine
- Mock adapter currently
- Real provider integration planned in Phase 12A

### 9.3 Fallback strategy
- Always fallback to template on:
  - LLM timeout
  - malformed response
  - grammar validation failure
  - LLM budget exceeded

---

## 10. Grammar Guardrails

### 10.1 Rule
Allow **max one non-critical grammar** per response.

### 10.2 Validation
Validate output after LLM generation. Prompt-only enforcement is insufficient.

---

## 11. Conversation Memory

- Last 3–5 interactions
- Token cap
- Truncate oldest first

---

## 12. LLM Adapter

### Current state
- Interface + mock adapter only

### Required in Phase 12A
- Real provider integration
- Timeout handling
- Output validation

---

## 13. LLM Throttling

- Per-session budget
- When exceeded → template fallback

---

## 14. Scheduling

- Session windows:
  - Morning 06:00–12:00
  - Afternoon 12:00–18:00
  - Evening 18:00–24:00
- Default check-ins:
  - 08:00, 15:00, 21:30
- If user initiates first in a window, skip bot check-in

---

## 15. Observability

- JSON logs with:
  - requestId
  - sessionId
  - userId
  - tokens
  - latency
  - fallback reason

---

## 16. Testing

- Extensive unit tests for all core logic
- Manual testing deferred to UAT (Phase 12A)

---

## 17. Known Limitations

- Pinyin segmentation heuristic set is limited
- Candidate resolver currently only uses curriculum seed
- LLM integration not yet real

---

## 18. Next Steps

- Phase 12A: integrate real LLM provider
- Phase 12B: full bot flow wiring
- Phase 13: deployment

