-- Seed the initial employee safely without duplication
INSERT INTO employees (name, mobile, department)
SELECT 'Jaykishor Singh', '7505633328', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM employees WHERE lower(trim(name)) = 'jaykishor singh' AND mobile = '7505633328'
);
