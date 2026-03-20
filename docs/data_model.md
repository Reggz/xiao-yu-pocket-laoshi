# Data Model

## 1. Core Entities

### users
- id (uuid)
- timezone
- email (nullable)
- phone_number (nullable)
- telegram_handle (nullable)
- preferred_name (nullable)
- membership_status (free | trial | paid | cancelled)
- subscription_tier (nullable)
- created_at
- last_active_at

### user_settings
- user_id
- target_language (e.g., zh)
- source_language (e.g., en)
- preferred_script (simplified | traditional)
- daily_schedule (json)
- quiet_hours (json)
- mode_preferences (json)
- topic_bias_ratio (default 0.7)
- session_windows (default [{\"start\":\"06:00\",\"end\":\"12:00\"},{\"start\":\"12:00\",\"end\":\"18:00\"},{\"start\":\"18:00\",\"end\":\"24:00\"}])
- session_checkins (default [\"08:00\",\"15:00\",\"21:30\"])

### topics
- id
- name
- description
- level (A0-A2)

### user_topics
- user_id
- topic_id
- priority (1-3)
- created_at

### subscriptions
- id
- user_id
- provider (stripe | apple | google)
- status (trial | active | past_due | cancelled)
- plan_id
- current_period_start
- current_period_end

### payments
- id
- subscription_id
- amount
- currency
- paid_at
- status (succeeded | failed | refunded)

### curriculum_units
- id
- level (A0, A1)
- title
- description

### curriculum_items
- id
- unit_id
- type (vocab | phrase | grammar)
- hanzi (simplified)
- pinyin
- english_gloss
- tags (json)
- grammar_patterns (json)
- unit_grammar (json)
- grammar_tier (text)

### curriculum_templates
- id
- unit_id
- template_text (hanzi)
- template_pinyin
- english_gloss
- slot_schema (json)

### curriculum_drills
- id
- unit_id
- drill_type (mcq | fill_blank | tone_choice)
- prompt
- choices (json)
- answer

### user_items
- user_id
- item_id
- mastery_level (0-5)
- seen_count
- correct_count
- last_seen_at
- next_due_at
- ease_factor

### exploratory_items
- id
- user_id
- source_text (e.g., "fried rice")
- suggested_hanzi
- suggested_pinyin
- suggested_english
- usage_count (int)
- last_triggered_at
- created_at
- promoted_to_item_id (nullable)

### interactions
- id
- user_id
- channel (telegram)
- type (chat | drill)
- mode (mcq | fill_blank | tone_selection | free_text)
- state (normal | awaiting_disambiguation)
- input_text_raw
- input_text_normalized
- input_pinyin_normalized
- missing_tone (boolean)
- output_text
- created_at

### normalization_candidates
- id
- interaction_id
- candidate_hanzi
- candidate_pinyin
- confidence
- selected (boolean)

### errors
- id
- interaction_id
- error_type (tone | word_order | vocab | particle | character | safety)
- details (json)

### onboarding_sessions
- id
- user_id
- started_at
- completed_at
- correct_count
- placed_level

## 2. Notes
- `curriculum_items` is the source of truth for level gating.
- `user_items` tracks mastery and scheduling.
- `exploratory_items` captures user code-switching and auto-hints.
- `normalization_candidates` stores possible corrections for ambiguous pinyin or incorrect characters.

## 3. Mastery Progression (Example)
- mastery_level 0: seen once, incorrect.
- mastery_level 1: seen 2-3 times, 50% correct.
- mastery_level 2: seen 4-5 times, 70% correct.
- mastery_level 3: seen 6-8 times, 85% correct.
- mastery_level 4: seen 9-12 times, 95% correct.
- mastery_level 5: stable, scheduled less frequently.

## 4. Scoring Weights
- Drills: full weight (1.0)
- Free-text: partial weight (0.3-0.5)
- Non-target language or unrelated input: no scoring

## 5. Scheduling Inputs
- `next_due_at` drives daily drill selection.
- `ease_factor` adjusts spacing based on accuracy.
