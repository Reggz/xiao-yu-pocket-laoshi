# PROJECT_API_MAP.md

Module-by-module API reference for Xiao Yu.

## src/config.ts
- `loadConfig(): Config`
  - Returns required env vars (TELEGRAM_BOT_TOKEN, DATABASE_URL) and optional LLM_API_KEY.

## src/bot/bot.ts
- `bot: Bot`
  - grammY bot instance
- `startBot(): void`
  - starts bot polling

## src/bot/menu.ts
- `menuOptions: MenuOption[]`
  - list of menu items (Free Chat, Micro-Drills, etc.)

## src/onboarding/placement.ts
- `placementQuestions: PlacementQuestion[]`
  - ordered list of placement prompts
- `getPlacementQuestion(index: number): PlacementQuestion | null`
- `scorePlacement(correctCount: number): string`
  - returns A0/A1/A2

## src/onboarding/topics.ts
- `availableTopics: string[]`
- `normalizeTopic(input: string): string | null`
- `validateTopicSelection(topics: string[]): string[]`
  - enforces max 3 topics

## src/curriculum/types.ts
- `CurriculumItem`, `GrammarItem`, `CurriculumUnit`, `Curriculum`

## src/curriculum/loader.ts
- `loadCurriculumFromFile(path: string): Curriculum`
  - parses docs/curriculum_seed.md

## src/curriculum/helpers.ts
- `getUnitsByTopic(curriculum, topics): CurriculumUnit[]`
- `listAllTopics(curriculum): string[]`
- `getUnitsForLevel(curriculum, allowedLevels): CurriculumUnit[]`

## src/input/types.ts
- `Token`, `TokenType`, `NormalizedInput`

## src/input/tokenize.ts
- `tokenize(input: string): Token[]`

## src/input/normalize.ts
- `normalizeInput(input: string): NormalizedInput`
  - sets missingTone flag

## src/input/candidate_resolver.ts
- `buildCandidateIndex(curriculum): CandidateIndex`
- `resolveCandidatesFromPinyin(canonicalPinyin, index): string[]`
- `loadCandidateIndexFromSeed(): CandidateIndex`

## src/input/correction.ts
- `suggestCloseMatches(input, vocabulary): string[]`
  - confusion groups + edit distance

## src/input/disambiguation.ts
- `startDisambiguation(pendingInput, candidates, nowMs): DisambiguationResult`
- `isDisambiguationExpired(state, nowMs, ttlMs?): boolean`
- `resolveDisambiguation(state, selection): string | null`

## src/response/templates.ts
- `pickTemplate(curriculum): TemplateResponse | null`

## src/response/grammar.ts
- `buildGrammarGuardrail(allowed, policy): string`
- `validateGrammarUsage(used, policy): { ok: boolean; reason?: string }`
- `selectAllowedGrammar(items, tiers): GrammarItem[]`

## src/response/buffer.ts
- `buildConversationBuffer(interactions, maxTurns, maxTokens): InteractionSnippet[]`

## src/response/hints.ts
- `buildAutoHint(english, hanzi, pinyin): Hint`
- `buildCorrectionHint(original, corrected, explanation): Hint`

## src/llm/adapter.ts
- `LlmAdapter.generate(request): Promise<LlmResponse>`
- `MockLlmAdapter`

## src/llm/throttle.ts
- `canUseLlm(budget): boolean`
- `recordLlmUse(budget): Budget`

## src/drills/fsrs.ts
- `createNewCard(now): Card`
- `scheduleWithRating(card, rating, now): Card`

## src/drills/scheduler.ts
- `pickDueItems(items, nowMs, limit): DrillItem[]`

## src/drills/scoring.ts
- `getModeWeight(mode): number`

## src/scheduler/windows.ts
- `getWindowForTime(time, windows?): SessionWindow | null`

## src/scheduler/checkins.ts
- `shouldSendCheckin(window, userInitiated): CheckinDecision`

## src/summary/recap.ts
- `buildRecap(recap): string`

## src/observability/logger.ts
- `emitLog(event: LogEvent): void`

## src/input/manual.ts
- prints normalization results for fixed samples

## src/input/cli.ts
- interactive CLI for manual normalization testing
