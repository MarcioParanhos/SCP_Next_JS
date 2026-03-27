-- Migration: 20260327000001_rename_employees_table
-- Description: Renames the "servidores" table and its Portuguese-named columns to English.
-- Changes:
--   Table   : servidores    → employees
--   Column  : matricula     → enrollment
--   Column  : vinculo       → bond_type
--   Column  : regime        → work_schedule
-- Also drops the old default constraint so the new column inherits the correct default.

-- Step 1: Rename Portuguese columns to their English equivalents
ALTER TABLE "servidores" RENAME COLUMN "matricula"    TO "enrollment";
ALTER TABLE "servidores" RENAME COLUMN "vinculo"      TO "bond_type";
ALTER TABLE "servidores" RENAME COLUMN "regime"       TO "work_schedule";

-- Step 2: Rename the table itself
ALTER TABLE "servidores" RENAME TO "employees";
