-- Save the actual video file (not just the caption/transcript) for reels/shorts/TikTok.
-- The mp4 is downloaded server-side and stored in the public 'saved' bucket; here we
-- keep a link to it and its size. Code degrades gracefully if this migration isn't
-- applied yet (insert retries without these columns, reads fall back to the basic set).
alter table if exists saved_items add column if not exists video_url text;   -- mp4 in the 'saved' bucket
alter table if exists saved_items add column if not exists video_size bigint; -- bytes (for a "download (N MB)" hint)
