-- Birthday greeting feature:
--   birthday       - user's birthday (year 1904 = year unknown, only day+month given)
--   bday_wished_on - date of the last birthday greeting sent (guards against duplicates)
alter table users add column if not exists birthday date;
alter table users add column if not exists bday_wished_on date;
