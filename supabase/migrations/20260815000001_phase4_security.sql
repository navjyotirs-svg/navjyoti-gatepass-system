-- Remove the permissive public read policy from the base table
DROP POLICY IF EXISTS "Public read active employees" ON employees;

-- Create a policy that completely restricts direct access to employees for anon users
-- We only want the server to access this table using a service role key.
-- Alternatively, if we need authenticated admins to see it later, we can add auth policies.
-- For now, anon should not have any access to the employees table.

-- The public_employee_directory view is already created. 
-- In PostgreSQL, views execute with the privileges of their creator (security definer) by default.
-- Therefore, anon users can still read from the view even if the underlying table is blocked.
