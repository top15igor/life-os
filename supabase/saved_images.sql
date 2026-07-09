-- Save ALL photos of a post/carousel (not just the cover thumbnail), so the bot can
-- return the whole album to the user like "Save As Bot" does, and the Knowledge Base
-- can show a gallery. image_url stays the first frame (cover) for backward compatibility.
-- Code degrades gracefully if this migration isn't applied yet (insert retries without it).
alter table if exists saved_items add column if not exists image_urls jsonb; -- string[] of stored image URLs in the 'saved' bucket
