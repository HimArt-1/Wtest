-- Support AI usage throttling and audit queries.

CREATE INDEX IF NOT EXISTS system_logs_ai_usage_idx
ON public.system_logs(source, user_id, created_at DESC)
WHERE source = 'ai.generation';
