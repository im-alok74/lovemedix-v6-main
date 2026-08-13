-- 026 — Null out image columns that do not contain an image URL.
--
-- `medicines.image_url` / `photo_url` are free text filled by data entry and bulk uploads.
-- A handful of rows hold values pasted from a browser address bar — Google search and
-- `/imgres` preview links — plus a few strings that are not URLs at all.
--
-- These are not merely broken images. `next/image` throws when given an absolute URL whose
-- host is not in `images.remotePatterns`, and that throw happens during render, so a single
-- bad row took its entire product page down. `/medicines/cavit-xt-tablet-15-s-1497` was one
-- of them.
--
-- The durable fix is in `lib/images.ts`, which validates every src at the render boundary,
-- so a bad row degrades to a placeholder instead of breaking a page. This migration is the
-- accompanying data cleanup: it does not prevent the next bad paste, it just clears the
-- current ones so those products show a placeholder rather than nothing.
--
-- Idempotent. Safe to re-run.

BEGIN;

-- 1. Search-engine result and image-preview links. These resolve to an HTML page, never
--    to an image.
UPDATE medicines
SET image_url = NULL
WHERE image_url ~* 'https?://([a-z0-9-]+\.)*google\.[a-z.]+/(url|imgres|search)';

UPDATE medicines
SET photo_url = NULL
WHERE photo_url ~* 'https?://([a-z0-9-]+\.)*google\.[a-z.]+/(url|imgres|search)';

-- 2. Values that are not URLs and not local paths — leftover filenames, notes, "N/A".
UPDATE medicines
SET image_url = NULL
WHERE COALESCE(image_url, '') <> ''
  AND image_url !~* '^(https?://|/|data:image/)';

UPDATE medicines
SET photo_url = NULL
WHERE COALESCE(photo_url, '') <> ''
  AND photo_url !~* '^(https?://|/|data:image/)';

-- 3. Same treatment for the gallery table.
UPDATE medicine_images
SET image_url = NULL
WHERE COALESCE(image_url, '') <> ''
  AND (
    image_url ~* 'https?://([a-z0-9-]+\.)*google\.[a-z.]+/(url|imgres|search)'
    OR image_url !~* '^(https?://|/|data:image/)'
  );

DELETE FROM medicine_images WHERE COALESCE(image_url, '') = '';

COMMIT;

-- What image hosts remain. Every host listed here must also appear in
-- `images.remotePatterns` in next.config.mjs and in ALLOWED_HOSTS in lib/images.ts,
-- or next/image will reject it at render time.
SELECT
  COALESCE(NULLIF(substring(url from '^https?://([^/]+)'), ''), '(local or data URI)') AS host,
  COUNT(*)::int AS images
FROM (
  SELECT image_url AS url FROM medicines        WHERE COALESCE(image_url, '') <> ''
  UNION ALL
  SELECT photo_url        FROM medicines        WHERE COALESCE(photo_url, '') <> ''
  UNION ALL
  SELECT image_url        FROM medicine_images  WHERE COALESCE(image_url, '') <> ''
) u
GROUP BY 1
ORDER BY images DESC;
