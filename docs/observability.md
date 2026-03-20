# Observability

## 1. What We Track (v1)
- Requests and responses (input/output text, mode, level).
- Errors (LLM timeouts, normalization failures, safety blocks).
- LLM usage (tokens, cost per user).
- Latency (total response time and LLM call latency).
- Correction events (what was corrected and why).
- Safety events (blocked or redirected content).
- Trace IDs (request_id, session_id).

## 2. Log Format (Recommended)
Use JSON logs with required fields:
- timestamp
- request_id
- session_id
- user_id
- mode
- level
- input_length
- output_length
- llm_tokens_in
- llm_tokens_out
- llm_cost_usd
- latency_ms
- llm_latency_ms
- safety_event (boolean)
- error_type (nullable)

## 3. How to Read Logs
- Filter by request_id to inspect a single interaction.
- Filter by session_id to reconstruct a session.
- Aggregate llm_cost_usd for spend tracking.
- Track latency_ms p95 to identify slow paths.

## 4. Good Practice (Future)
- Define log retention policy (e.g., 30-90 days).
- Redact PII in logs.
- Add sampling for non-error logs if volume grows.
