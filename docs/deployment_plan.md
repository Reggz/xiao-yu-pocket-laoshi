# Deployment Plan (Staging + Production)

## 0. Goals
- Production-ready Telegram bot using webhooks (Vercel).
- Separate staging environment for safe testing.
- Clear cost expectations and rollback path.

---

## 1. Environments

### Staging
- Separate Telegram bot token.
- Separate database (Supabase free project is enough).
- Separate Vercel project or separate Vercel environment.
- Intended for testing before prod.

### Production
- Primary Telegram bot token.
- Primary database.
- Stable Vercel deployment.

---

## 2. Cost Expectations (MVP)
- Vercel: free tier is usually enough for small bots.
- Supabase: free tier usually enough for MVP.
- LLM: pay per token (no guaranteed free tier). Budget $1–3 per user/month is feasible with throttling.

---

## 3. Required Accounts & Setup
- Telegram BotFather (create bots).
- Vercel account.
- Supabase account (or your own Postgres).
- OpenAI API key (LLM_PROVIDER=openai).

---

## 4. Environment Variables

Shared:
- TELEGRAM_BOT_TOKEN
- DATABASE_URL
- LLM_API_KEY
- LLM_PROVIDER=openai
- LLM_MODEL=gpt-4.1-mini
- LLM_BASE_URL (optional)
- LLM_DISABLE_CAPS=false
- INTERACTIONS_RETENTION_DAYS=90
- RETENTION_SECRET=

Staging uses staging tokens + DB URL.
Production uses production tokens + DB URL.

---

## 5. Vercel Deployment (Webhook)

### 5.1 Create Vercel Projects
- `xiao-yu-staging`
- `xiao-yu-production`

### 5.2 Set Env Vars
- In each project, set the correct env values.

### 5.3 Deploy
- Connect GitHub repo to Vercel.
- Deploy staging first, then production.

---

## 6. Telegram Webhook

### Staging Webhook
```
https://api.telegram.org/bot<STAGING_TOKEN>/setWebhook?url=https://<your-staging-url>/api/telegram
```

### Production Webhook
```
https://api.telegram.org/bot<PROD_TOKEN>/setWebhook?url=https://<your-prod-url>/api/telegram
```

Note: In production, webhook should point to the Vercel route that receives updates.

---

## 7. Scheduler

### Option A: Vercel Cron
- Use `vercel.json` to schedule.
- Trigger `/api/scheduler` endpoint.

### Option B: Supabase Scheduled Functions
- Cron inside Supabase to call your scheduler endpoint.

---

## 7.1 Retention Cleanup
- Vercel cron calls /api/retention weekly (see vercel.json).
- Protected by RETENTION_SECRET.

## 8. Staging Workflow
1. Push code to GitHub.
2. Vercel auto-deploys staging.
3. Test with staging bot token.
4. If stable, deploy to production.

---

## 9. Rollback
- Revert GitHub commit and redeploy.
- Or rollback to prior Vercel deployment.

---

## 10. Notes
- Staging is optional but recommended for professional workflows.
- If only you are using the bot, you can delay staging, but you will break your own production bot during changes.
- Admin testing: set `LLM_DISABLE_CAPS=true` in staging for exploratory testing.
