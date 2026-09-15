-- Persist the outbound notification state so worker retries remain idempotent.
ALTER TABLE billing_webhook_events ADD COLUMN discord_notification_sent_at TIMESTAMP;
