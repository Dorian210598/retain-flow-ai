-- Reset all user accounts and profiles
-- First delete profiles (due to foreign key constraints)
DELETE FROM public.profiles;

-- Delete all users from auth schema
DELETE FROM auth.users;