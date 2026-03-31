# Deployment Runbook (Phase 13)

This is the authoritative checklist for production-ready deployment. Follow in order.

## 1) Define Environments
- Staging bot token + DB
- Production bot token + DB
- Decide if staging is enabled now or later

## 2) Create API Endpoints
- Add `/api/telegram` webhook handler
- Add `/api/scheduler` for cron check-ins

## 3) Add Vercel Config
- Add `vercel.json` with cron schedules for `/api/scheduler`
- Ensure runtime set to Node

## 4) Secrets & Env Setup
- `TELEGRAM_BOT_TOKEN`
- `DATABASE_URL`
- `LLM_API_KEY`
- `LLM_PROVIDER`
- `LLM_MODEL`
- `LLM_DISABLE_CAPS`
- `INTERACTIONS_RETENTION_DAYS` (default 90)
- `RETENTION_SECRET` (protects /api/retention)

## 5) Deploy Staging
- Push branch → Vercel staging deploy
- Verify `/api/telegram` reachable

## 6) Set Webhook (Staging)
- Use staging bot token
- Point webhook to staging URL

## 7) Run DB Migrations
- Apply migrations to staging DB

## 8) Staging Tests
- Free-text chat
- Disambiguation flow
- Auto-hint flow
- LLM fallback behavior

## 9) Deploy Production
- Deploy main branch to Vercel production

## 10) Set Webhook (Production)
- Use production bot token
- Point webhook to prod URL

## 11) Production Sanity Test
- Basic chat
- LLM response
- Check logs

---

### Notes
- Always test staging before production.
- If only you are the user, you can delay staging, but risk breaking production.
- Admin testing: set `LLM_DISABLE_CAPS=true` in staging.
- Retention: /api/retention runs weekly via Vercel cron; set `RETENTION_SECRET` to prevent public access.
