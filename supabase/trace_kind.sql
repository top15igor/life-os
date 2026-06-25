-- Тип доброго дела (помощь/поддержка/забота/подарок/знания/волонтёрство/семья/сообщество).
alter table if exists good_deeds add column if not exists kind text;
