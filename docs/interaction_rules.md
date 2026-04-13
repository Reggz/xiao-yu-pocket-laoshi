# Interaction Rules

## 1. Input Handling
- Accept:
  - Pinyin with tones ("wo3 jiao4 xiao3 ling2")
  - Pinyin without tones ("wo jiao xiao ling")
  - Simplified characters ("我叫小玲")
  - Mixed Chinese + English ("我叫 Sarah")
- Normalize all inputs to canonical (hanzi + pinyin) before processing.
- If input includes ambiguous pinyin, choose candidate based on:
  - Current level vocabulary
  - Most frequent usage in corpus
  - Previous user patterns
  - If confidence is low, present 2-3 candidates and ask the user to confirm.
- Use Telegram inline keyboard buttons for candidate selection.
- When awaiting disambiguation, treat button callbacks or numeric replies as selection and bypass normalization.

## 2. Character Correction
- If a character is incorrect but the pinyin matches intended meaning, suggest correction.
- Example:
  - Input: "我脚 Sarah"
  - Correction: "我叫 Sarah"
  - Explanation: "脚 jiao3 means feet. Here, 叫 jiao4 is the correct character meaning 'to be called'."
- Corrections are shown as gentle hints, not hard errors.

## 3. Response Generation
- Core response must only use allowed vocab/grammar for the user's level.
- Enforce grammar_patterns whitelist per level; no complex conjunctions.
- Grammar tiers: critical, core, advanced. Allow at most one non-critical grammar per response.
- LLM may paraphrase but cannot introduce out-of-level items.
- Output format for tutor responses: Chinese, pinyin with tone marks, English (except MCQ prompts).
- Keep responses short and conversational.
- LLM context includes the last 3-5 interactions with a strict token cap.
- If context exceeds budget, fall back to templates without LLM.
 - Level + 1 hinting: allow up to ~10% unlearned tokens per session with auto-hints.

## 3.1 Mode Navigation
- Provide a menu to enter/exit practice modes at any time.
- Allow switching modes mid-session without losing progress.
- Menu also supports account actions (settings, subscribe/upgrade).

## 3.2 Onboarding and Placement
- Offer a short placement flow on first use, with an option to skip.
- Placement uses a sequence of micro-challenges increasing in difficulty.
- Use correct_count to set starting level and unlock units.

## 3.3 Practice Modes and Scoring
Micro-drill MCQ (default):
- Vocabulary MCQ, grammar MCQ, tone MCQ.
- Full scoring weight (1.0).
- Answers via buttons only.
Advanced free chat (optional):
- Partial scoring weight (0.3-0.5).
- To score, require at least 50% of tokens in the target language (Mandarin or pinyin).
- Mixed input scores only the Mandarin portions.

## 3.4 Topic-Based Learning
- Ask users to select 1-3 topics of interest.
- Prioritize those topics in drill selection and conversation templates.
- Rotate topics to avoid repetition.
 - Topic tagging is at unit-level; items and templates inherit tags.
 - Topic bias ratio is configurable (default 0.7).
 - If topic pool is too small, fall back to general content for the user's level.
 - LLM can generate adjacent topic content only when topic pool is thin; gate by quota and tier.

## 4. Auto-Hints
- If user uses unknown English term, auto-show the Mandarin equivalent.
- If new character or pinyin is used incorrectly, auto-show correction with explanation.
- Auto-hints appear once per item, then only on request.

## 5. Free-Text Scoring
- Free-text has partial weight (0.3-0.5) for mastery updates.
- Score only when the user uses level-appropriate items.
- Do not score when input is unrelated or non-target language.
- If user writes Mandarin with English slots ("我吃 fried rice"), score Mandarin items and create exploratory vocab for the English slot.
- If user uses pinyin without tone ("wo chi fried rice"), normalize to candidate pinyin and score Mandarin items.

## 6. Safety and Content Boundaries
- Block or redirect content involving hate, harassment, sexual content, or explicit profanity.
- Provide a safe, neutral response and steer back to learning.
- Do not allow the LLM to generate content outside learning context.

## 7. Session Summary
- After N turns, summarize:
  - What user did right
  - Errors and corrections
  - New vocab added
  - Next due items

## 8. Scheduling Behavior
- Sessions are divided into three daily windows:
  - Morning: 06:00-12:00
  - Afternoon: 12:00-18:00
  - Evening: 18:00-24:00
- A session can be triggered by user or bot within the window.
- If the user initiates first, the bot does not send a check-in for that window.
- Default bot check-in times: 08:00, 15:00, 21:30 local time.
- Session length (number of turns) configurable per user.
- Quiet hours respected.
- Each micro-session should be short, like a real conversation (few back-and-forth turns).
- Event-based pings: if no interaction by evening, send a micro-drill teaser rather than a generic reminder.

## 9. Onboarding Gate
- If onboarding is incomplete, bot replies with instructions to use `/start`, then `/done` or `/skip`.
- LLM use is disabled until onboarding is complete.

## 10. Power Controls
- `/pause` blocks all chat responses except `/resume` and `/reset`.
- `/resume` re-enables normal chat.
- `/reset` clears session state and requires onboarding again.
