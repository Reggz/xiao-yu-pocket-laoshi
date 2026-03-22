# Product Requirements Document (PRD)

## 1. Overview
Build a Telegram-based chatbot for English speakers learning Mandarin. The product combines free-form chat with scheduled micro-drills to build vocabulary, grammar, and tone awareness in a casual, low-friction experience. v1 is text-first and uses simplified characters, pinyin, and English glosses for new items.

## 2. Goals
- Provide casual, always-available practice with immediate feedback.
- Reinforce learning via spaced repetition and micro-drills.
- Keep responses level-appropriate to avoid cognitive overload.
- Allow code-switching in user responses and auto-surface new vocab.
- Accept flexible user inputs (pinyin with/without tones, characters, mixed English).
- Keep sessions short, like a real micro conversation (few back-and-forth turns).

## 2.1 Brand and Voice
- Brand identity, tone, and positioning are defined in `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/brand.md`.
- Levels are internal only; user-facing copy avoids technical level labels.

## 3. Non-Goals (v1)
- Audio input or pronunciation scoring.
- Full conversational fluency claims.
- Long-form curriculum or rigid lessons.

## 4. Target User
- English speakers learning Mandarin from scratch (A0-A1).
- Prefers casual practice over structured lessons.

## 5. Core Experience (Detailed)
1. User starts chat and completes a lightweight onboarding.
2. Bot assigns initial level (A0) and begins with short, level-gated prompts.
3. User selects or is guided into a practice mode.
4. User replies in Mandarin, pinyin, or English.
5. Bot normalizes input to a canonical representation (characters + pinyin) before response.
6. Bot replies in level-appropriate Mandarin, optionally mixing English for clarity.
7. When the user uses unknown English terms, the bot auto-suggests the Mandarin equivalent and logs it as exploratory vocab.
8. End-of-session recap: correct usage, errors, new vocab, and next due items.

Practice Modes:
Micro-drill MCQ.
Fill in the blank.
Tone selection.
Free-text mini conversation.

## 5.1 Onboarding and Placement (Optional)
- Provide an optional placement flow to avoid forcing advanced users into A0.
- Placement uses a short sequence of increasingly difficult micro-challenges inside chat.
Example progression: Q1 (A0) translate "Hello, I am [Name]."
Example progression: Q2 (A1) "I want to drink coffee."
Example progression: Q3 (A1+) "I ate 3 bowls of rice yesterday."
Example progression: Q4 (A2) use 把 or 着 in a short sentence.
Example progression: Q5 (B1) short micro-story + "What happened?"
Scoring and placement (example): 0-1 correct start at Unit 1 (A0).
Scoring and placement (example): 2-3 correct start at Unit 5 (late A1).
Scoring and placement (example): 4-5 correct unlock A2 content.

## 5.2 Topic-Based Learning
- Ask users for 1-3 topics of interest (food ordering, taxis, small talk, sports, work).
- Prioritize drills and conversation templates aligned with those topics.
- Use topics to guide vocabulary exposure and reinforcement.

## 5.3 How to Use the Bot (Navigation)
- Users can initiate free-text practice at any time.
- Menu access (e.g., typing `menu`) lets users switch modes, update preferences, pause/resume, get support, or delete account.
- Help phrases such as "please explain" or "我不知道" trigger clarification.

## 6. Input Normalization and Error Recovery
- Add close-match correction layer before disambiguation.
- Accepted input formats:
  - Pinyin with tones (e.g., "wo3 jiao4 xiao3 ling2")
  - Pinyin without tones (e.g., "wo jiao xiao ling")
  - Pinyin with tone marks (e.g., "Nǐ hǎo")
  - Simplified characters (e.g., "我叫小玲")
  - Mixed Chinese + English (e.g., "我叫 Sarah")
- System behavior:
  - Normalize pinyin without tones into candidate pinyin with tones.
  - Track `missingTone` when pinyin lacks tones to guide downstream correction.
  - Map pinyin to candidate characters using curriculum vocabulary and common frequency lists.
  - If confidence is low, present 2-3 candidate interpretations instead of forcing a single correction.
  - Present candidates via Telegram inline buttons to avoid numeric replies being mis-normalized.
  - If user inputs an incorrect character, infer intended pinyin and suggest the correct character with a brief explanation.

Example:
User: "我脚 Sarah" (uses 脚 instead of 叫)
System:
- Infer pinyin: "wo jiao Sarah"
- Suggest correction: "我叫 Sarah"
- Explain: "脚 jiao3 means feet. Here, 叫 jiao4 means 'to be called'."

## 7. Interaction Examples

### Example A: Code-Switching + Auto Hint
User: "你好，今天我吃 fried rice."
Bot (core): "很好！你喝什么？"
Bot (auto hint): "`fried rice` 可以说 `炒饭` (chao3 fan4)."

### Example B: Level-Gated Response
User: "我昨天和朋友去看电影。"
Bot (A0 level): "很好！你今天做什么？"
Note: The bot avoids advanced vocabulary and past tense patterns, keeping A0 output.

### Example C: Session Recap
- Correct: greeting, self-introduction
- Needs work: tone mark on `hao3`
- New vocab: `炒饭` (chao3 fan4) = fried rice
- Next due: `吃`, `喝`, `米饭`

## 8. Scheduling Behavior
- Sessions are divided into three daily windows:
  - Morning: 06:00-12:00
  - Afternoon: 12:00-18:00
  - Evening: 18:00-24:00
- A session can be triggered by user or bot within the window.
- If the user initiates first, the bot does not send a check-in for that window.
- Default bot check-in times: 08:00, 15:00, 21:30 local time.
- Each session targets a small set of back-and-forth turns (configurable).
- Quiet hours respected.
- Scheduling policy is configurable per user and can be adapted later.
- Event-based pings: if no interaction by evening, send a micro-drill teaser instead of a generic reminder.

## 9. Safety and Content Boundaries
- Block or redirect content involving hate, harassment, sexual content, or explicit profanity.
- Provide a safe, neutral response and steer back to learning.
- LLM must not generate content outside learning context.

## 9.1 Minimal Observability (Required for v1)
- Log requests, errors, and LLM usage cost per user.
- Track latency per response and drill completion rates.
- Log safety events (blocked content) and correction events.
- Use request/response IDs for traceability in logs.
- Observability reference: `/Users/reginald/Documents/Xiao Yu - Pocket Lao Shi/docs/observability.md`

## 10. Key Features
Practice Modes: micro-drill MCQ, fill in the blank, tone selection, free-text mini conversation.
Mode Navigation: menu to enter/exit modes at any time and access settings/upgrade.
Learning Engine: level-gated responses, Level + 1 exposure with auto-hints, spaced repetition scheduling, exploratory vocab curation, mode-specific scoring weights.
Grammar Guardrails: grammar_patterns whitelist per level, avoid complex conjunctions in LLM prompts.
- Grammar tiers: critical, core, advanced. Allow at most one non-critical grammar per response.
Topic Routing: unit-level topic tags inherited by items/templates, configurable topic bias ratio, fallback to general content when topic pool is too small.
Feedback and Hints: auto-hint for new items, correction hints with short explanations, session summaries and progress tracking.
Response Strategy: hybrid response engine (template-first, LLM fallback), caching with validation for stable prompts.
Response Context: use last 3-5 interactions with a strict token cap; fall back to templates when over budget.
Scheduling: daily micro-drills, event-based pings, configurable session length, three daily session windows, default check-in times.
Onboarding: optional placement micro-challenges to set starting level.
Topic Learning: user-selected topics (1-3) to prioritize drills and conversation templates.

## 10.1 LLM Provider Switching (Required)
- LLM integration must be provider-switchable via configuration.
- Support environment variables:
  - `LLM_PROVIDER` (default: `openai`)
  - `LLM_MODEL` (default: `gpt-4.1-mini`)
  - `LLM_BASE_URL` (optional override)
  - `LLM_API_KEY`
- Use an adapter factory so we can add new providers without changing core logic.
- Allow admin override to disable caps for exploratory testing: `LLM_DISABLE_CAPS=true`.

## 11. Success Metrics
- 7-day retention >= 25%.
- Median daily session length >= 3 turns.
- Mastered items per week >= 15 at A0.
- Positive feedback on clarity and usefulness.

## 12. Content Strategy
- Structured curriculum catalog as source of truth.
- Source of truth is docs/curriculum_seed.md in v1 (manual updates).
- Later migrate to DB-backed curriculum with admin import tool.
- A0/A1 units with curated vocab, phrases, and templates.
- LLM used for paraphrase and gentle correction within allowed content.

## 13. Cost and Performance
- Model-agnostic LLM interface.
- Prefer templated responses for drills and common prompts.
- LLM only for free-form chat and tailored feedback.
- Throttle LLM usage and fall back to templates when over budget.
- Cache stable prompts and validate outputs against level constraints.

## 14. Risks
- Repetitive conversations if response variation is limited.
- Learner confusion if level gating is too strict.
- High LLM costs if prompts are not constrained.

## 15. Technical Constraints (Revised)
- Language: TypeScript
- Telegram: grammY
- Database: Postgres (Supabase optional)
- Hosting: Vercel, with explicit cron/scheduler strategy
- Core Libraries: pinyin-pro, ts-fsrs
- System Requirements:
  - Provider-agnostic LLM interface
  - Error handling + retries for LLM timeouts
  - Rate limiting and request deduping
  - Logs for prompt/response and cost per user
  - Scheduler component required

## 16. Future Vision
- Curriculum expansion to A2-B2 with richer drills and topic coverage.
- Voice analysis for tone detection and pronunciation feedback.
- Multi-language learning (Indonesian -> English, English -> Bahasa Indonesia).
- Multi-channel deployment (Telegram, WhatsApp, custom app).

## 17. Open Questions
- Cost budget per user and target LLM call ratio.
- Default schedule and quiet hours.
- Mastery thresholds for level progression.
- Curriculum expansion depth now vs metadata-only for placement targeting.
- Evaluation/QA automation strategy.
- Feature flags and experimentation framework.
- Prompt/version management approach.
- Privacy/compliance requirements and data deletion flow.
- Admin tooling for manual overrides.

## 18. Phased Plan (15-30 min increments)

### Phase 1: Repo Scaffold and Config
- Initialize Node/TypeScript project structure.
- Add basic config loader and environment validation.
- Output: repo structure + config module + README quickstart.

### Phase 2: Telegram Bot Skeleton (grammY)
- Create bot entrypoint.
- Implement health check command (e.g., /ping).
- Output: bot responds to /ping locally.

### Phase 3: Database Schema (Core)
- Create schema for users, user_settings, topics, user_topics, interactions.
- Add exploratory_items usage_count and last_triggered_at fields.
- Output: DB migration files and basic schema tests.

### Phase 4: Curriculum Loader
- Load curriculum seed from file or DB.
- Implement unit/topic tagging and level gating helper.
- Output: unit/vocab lookup works with tests.

### Phase 5: Onboarding and Menu Navigation
- Add placement flow (skippable) and topic selection.
- Implement `menu` command with mode switching and settings.
- Output: onboarding flow and menu handlers working.

### Phase 6: Input Normalization Pipeline
- Detect input type (pinyin with/without tone, hanzi, mixed).
- Normalize to canonical form.
- Add disambiguation state and inline keyboard candidate selection.
- Output: tests for normalization and correction suggestions.

### Phase 7: Response Engine (Template + LLM Interface)
- Template-based replies within level.
- LLM adapter interface with timeout handling and output validation.
- Enforce grammar_patterns whitelist and avoid complex conjunctions.
- Add conversation buffer (last 3-5 interactions) with token budget.
- Throttle LLM usage and fall back to templates when over budget.
- Output: deterministic replies + mocked LLM tests.

### Phase 8: Auto-Hint and Correction
- Detect unknown items and incorrect characters.
- Attach auto-hint with explanation.
- Output: test cases for hint generation.

### Phase 9: Scheduler and Session Windows
- Implement three daily session windows and default check-in times.
- Enforce user-initiated vs bot-initiated rule per window.
- Output: simulated daily session payload.

### Phase 10: Drill Queue and Scoring
- Implement ts-fsrs scheduling and scoring weights by mode.
- Output: due-item selection and scoring tests.

### Phase 11: Session Summary and Analytics Logs
- Generate recap (correct/errors/new items).
- Emit observability logs with trace IDs.
- Output: summary output and log samples.

### Phase 12A: LLM Integration (Real Provider)
- Wire adapter to chosen LLM provider.
- Confirm timeouts and error handling.
- Output: real LLM call path tested.

### Phase 12B: Integration Pass
- Wire all components together (LLM enabled).
- End-to-end test: message in -> response out.
- Output: basic working loop with LLM.

### Phase 13: Deployment Prep
- Vercel config and cron strategy.
- Environment variables documented.
- Output: deployable build.

## 10.2 Onboarding Gate (Required)
- Users must complete onboarding (`/start` then `/done` or `/skip`) before free chat.
- LLM responses are blocked until onboarding is complete; bot uses templates only.

## 10.3 Power Controls (Required)
- `/pause` stops normal chat and prevents LLM calls until `/resume`.
- `/resume` restores normal chat.
- `/reset` clears session state and requires `/start` again.
