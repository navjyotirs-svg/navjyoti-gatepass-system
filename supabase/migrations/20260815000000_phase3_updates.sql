-- 1. Update gate_pass_requests
ALTER TABLE gate_pass_requests ADD COLUMN IF NOT EXISTS meeting_target_type TEXT;
ALTER TABLE gate_pass_requests ADD COLUMN IF NOT EXISTS department_target TEXT;
ALTER TABLE gate_pass_requests ALTER COLUMN employee_id DROP NOT NULL;

-- 2. Insert Approved Employees safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM employees WHERE name = 'Mr. Gurusharan Khurana') THEN
        INSERT INTO employees (name, mobile, department, active) VALUES ('Mr. Gurusharan Khurana', '+919810615904', NULL, true);
    ELSE
        UPDATE employees SET mobile = '+919810615904' WHERE name = 'Mr. Gurusharan Khurana';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE name = 'Jaykishor Singh') THEN
        INSERT INTO employees (name, mobile, department, active) VALUES ('Jaykishor Singh', '+917505633328', NULL, true);
    ELSE
        UPDATE employees SET mobile = '+917505633328' WHERE name = 'Jaykishor Singh';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE name = 'Jai Kumar') THEN
        INSERT INTO employees (name, mobile, department, active) VALUES ('Jai Kumar', '+919193618538', NULL, true);
    ELSE
        UPDATE employees SET mobile = '+919193618538' WHERE name = 'Jai Kumar';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE name = 'Gurpreet') THEN
        INSERT INTO employees (name, mobile, department, active) VALUES ('Gurpreet', NULL, NULL, true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE name = 'Rahul Kumar') THEN
        INSERT INTO employees (name, mobile, department, active) VALUES ('Rahul Kumar', '+917302614061', NULL, true);
    ELSE
        UPDATE employees SET mobile = '+917302614061' WHERE name = 'Rahul Kumar';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE name = 'Vipan') THEN
        INSERT INTO employees (name, mobile, department, active) VALUES ('Vipan', NULL, NULL, true);
    END IF;
END $$;

-- 3. Storage Bucket for visitor-photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('visitor-photos', 'visitor-photos', false, 2097152, '{"image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO UPDATE SET 
  public = false, 
  file_size_limit = 2097152, 
  allowed_mime_types = '{"image/jpeg","image/png","image/webp"}';

-- Ensure RLS is enabled on storage.objects (REMOVED, Supabase manages this)

-- Policy: Anonymous visitor photo uploads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow visitor photo uploads'
    ) THEN
        CREATE POLICY "Allow visitor photo uploads"
        ON storage.objects
        FOR INSERT
        TO anon
        WITH CHECK (bucket_id = 'visitor-photos');
    END IF;
END $$;
