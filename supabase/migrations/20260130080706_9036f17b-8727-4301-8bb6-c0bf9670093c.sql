-- Make the media bucket public so images/videos can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'media';