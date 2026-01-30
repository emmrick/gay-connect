-- Enable realtime for profiles table to track online status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;