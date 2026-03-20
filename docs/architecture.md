# Solution Architecture

## 1. Architecture Goals
- Model-agnostic LLM usage with strict level constraints.
- Modular services that can be reused across Telegram, WhatsApp, or custom apps.
- Clear separation between curriculum, learner state, and response generation.
- Input normalization to handle pinyin, missing tones, and incorrect characters.

## 2. High-Level Components
1. Channel Adapter
   - Telegram now, WhatsApp later.
   - Normalizes inbound/outbound messages.
   - Handles inline keyboard callbacks for disambiguation selections.
   - Supports menu navigation (mode switch, settings, upgrade).

2. Curriculum Service
   - Stores units, vocab, grammar patterns, templates, and drills.
   - Stores grammar_patterns whitelist per level.
   - Stores grammar tiers and non-critical limit.
   - Defines level constraints and prerequisites.
   - Stores topic tags for units and templates.

3. Learner State Service
   - Stores per-user mastery, error patterns, and scheduling metadata.
   - Curation layer: promotes exploratory vocab to mastery only after repeated use or high-frequency tags.

4. Settings and Entitlements Service
   - Stores user preferences (language, schedule, mode defaults).
   - Manages membership status and subscription tier.
   - Stores user topic preferences (1-3 active topics).

5. Onboarding and Placement Service
   - Runs optional placement micro-challenges.
   - Sets initial level and unlocked units based on score.

6. Scheduler
   - Generates daily drill sessions.
   - Respects quiet hours and variable schedules.

7. Input Normalization Service
   - Detects input format (characters, pinyin with tones, pinyin without tones, mixed English).
   - Builds candidate lists from curriculum index for disambiguation.
   - Applies close-match correction before disambiguation.
   - Tracks missingTone for tone-less pinyin inputs.
   - Converts to canonical representation (characters + pinyin).
   - Resolves ambiguous pinyin with curriculum context and common frequency lists.
   - Confidence Gate + Candidate Resolver: if confidence is low, return 2-3 candidate interpretations.
   - Suggests corrections for incorrect characters (e.g., 脚 -> 叫).

8. Response Engine
   - Level gating and template selection.
   - Hybrid response path: template-first, LLM fallback only when needed.
   - Uses a short conversation buffer (last 3-5 interactions) with token budget.
   - Throttles LLM usage and falls back to templates when over budget.
   - Handles auto-hint when new vocab appears.

9. Summary Engine
   - Generates end-of-session recap.
   - Updates mastery stats.

## 2.1 LLM Provider Switching
- LLM adapter factory chooses provider at runtime.
- Environment configuration:
  - `LLM_PROVIDER` (default: openai)
  - `LLM_MODEL` (default: gpt-4.1-mini)
  - `LLM_BASE_URL` (optional override)
  - `LLM_API_KEY`
- Admin override: `LLM_DISABLE_CAPS=true` disables throttling for exploratory testing.

## 3. Data Flow
1. User sends message via Telegram.
2. Channel Adapter sends message to Input Normalization Service.
3. Input Normalization produces canonical form + correction suggestions.
4. Response Engine queries Learner State for level and due items (currently in-memory; DB-backed learner state pending).
5. Response Engine queries Curriculum for allowed vocab and templates.
6. If message includes unknown terms, Response Engine logs exploratory vocab and auto-hint.
7. Response Engine returns a level-appropriate reply + optional hint.
8. Learner State updates mastery and interaction logs.
9. Summary Engine builds recap after N turns or session end.

## 4. LLM Usage (Model-Agnostic)
- Prompt includes: allowed vocab list, allowed grammar patterns, current topic, target response length.
- LLM must stay within constraints and avoid introducing out-of-level items.
- LLM can be bypassed for templated replies and drills.

## 5. Scheduling
- Daily sessions at configurable local times.
- Each session includes: due items + a small number of new items.
- Scheduler uses learner engagement to adapt frequency.

## 6. Observability
- Log all prompts, responses, and corrections.
- Track cost per user per day.
- Monitor drill completion rates and mastery progression.
- Cache stable prompts and validate outputs against level constraints.
- Track latency per response and per LLM call.
- Log safety events (blocked content).
- Maintain request/response IDs for traceability.

## 7. Extensibility
- Add additional languages by creating new curriculum catalogs.
- Add audio later via separate speech service, without changing core services.
