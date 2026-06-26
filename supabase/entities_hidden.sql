-- Hide a person/place from the book and lists (without deleting their links to entries).
alter table if exists people add column if not exists hidden boolean default false;
alter table if exists places add column if not exists hidden boolean default false;
