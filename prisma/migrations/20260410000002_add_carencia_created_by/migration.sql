-- Migration: add created_by_id to carencias
-- Adiciona coluna para rastrear o usuário que criou a carência,
-- cria a foreign key para a tabela "User" e adiciona índice.

ALTER TABLE "carencias"
  ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;

-- Adiciona constraint de FK se não existir (usa função plpgsql para checagem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'carencias_created_by_id_fkey'
  ) THEN
    ALTER TABLE "carencias"
      ADD CONSTRAINT "carencias_created_by_id_fkey"
      FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "IDX_carencias_created_by" ON "carencias" ("created_by_id");
