-- Fix RLS policy for admin_users table
-- This allows authenticated users to read admin_users
-- The application layer will check if user is admin

-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;

-- Create a new policy that allows authenticated users to read
CREATE POLICY "Authenticated users can read admin_users"
  ON admin_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Note: The application layer (page /admin) uses createSupabaseAdminClient() 
-- to check admin status, which bypasses RLS using the service role key

