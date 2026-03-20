# Progress Tracker

## Done
- Phase 1A: Repo scaffold (src/, docs/, tsconfig.json, README)
- Phase 1B: Config and env validation (src/config.ts, .env.example)
- Phase 2A: Telegram bot entrypoint (src/bot.ts)
- Phase 2B: /ping health check
- Phase 3A: Core DB schema migration (001_init.sql)
- Phase 3B: Exploratory tracking migration (002_exploratory_tracking.sql)
- Phase 4A: Curriculum loader + tests
- Phase 4B: Topic + level helpers + tests
- Phase 5A: Placement flow + tests
- Phase 5B: Topic selection + tests
- Phase 5C: Menu options + tests
- Phase 6A: Input detection + tests
- Phase 6B: Normalization + tests
- Phase 6C: Disambiguation state + tests
- Phase 6D: Close-match correction + tests
- Phase 7A: Template response engine + tests
- Phase 7B: LLM adapter + tests
- Phase 7C: Grammar guardrails + tests
- Phase 7D: Conversation buffer + tests
- Phase 7E: LLM throttling + tests
- Phase 8: Auto-hint and correction + tests
- Phase 9A: Session windows + tests
- Phase 9B: Check-in rules + tests
- Phase 10A: Drill queue (ts-fsrs) + tests
- Phase 10B: Scoring weights + tests
- Phase 11A: Session summary + tests
- Phase 11B: Observability logs + tests
- Pipeline wiring: bot handlers connected to input normalization, disambiguation, templates, and safety
- Topic bias and English auto-hints wired into runtime flow
- DB alignment: added migrations for documented tables/fields (003_additional_tables.sql)
- DB persistence adapter added for interactions
- Scheduler runner stub added for cron wiring
- Phase 12A: LLM integration (real provider) wired to response engine
- Phase 12B: Integration pass (end-to-end bot flow with LLM) completed

## In Progress
- Phase 13: Deployment prep
