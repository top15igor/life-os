-- User subscription plan: 'free' | 'pro' | 'premium'. Gates premium-only features (Biographer).
alter table if exists users add column if not exists plan text default 'free';

-- Owner gets Premium (for testing / personal use).
update users set plan = 'premium' where id = '00000000-0000-0000-0000-000000000000';
