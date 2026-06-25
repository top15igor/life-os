-- «Акцент главной»: какой пресет блоков показывать (осознанность/фокус/след/баланс/минимум).
alter table if exists users add column if not exists home_preset text;
