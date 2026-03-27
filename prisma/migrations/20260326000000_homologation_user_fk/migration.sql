-- Migração: adiciona chave estrangeira de homologação para o usuário
--
-- Contexto: a coluna `performed_by` armazenava o email do usuário como texto
-- livre. Esta migração:
--   1. Adiciona a coluna `performed_by_id` (TEXT, nullable) com FK para `User.id`
--   2. Migra os dados existentes: converte o email armazenado em `performed_by`
--      para o `id` do usuário correspondente (quando encontrado)
--   3. Remove a coluna legada `performed_by`

-- Passo 1: adiciona a nova coluna sem constraint ainda (para permitir migração dos dados)
ALTER TABLE "homologations" ADD COLUMN "performed_by_id" TEXT;

-- Passo 2: migração de dados
-- Atualiza `performed_by_id` com o `id` do `User` cujo email bate com o valor
-- armazenado em `performed_by`. Registros sem correspondência ficam NULL.
UPDATE "homologations" h
SET "performed_by_id" = u."id"
FROM "User" u
WHERE u."email" = h."performed_by";

-- Passo 3: remove a coluna legada
ALTER TABLE "homologations" DROP COLUMN "performed_by";

-- Passo 4: adiciona a constraint de chave estrangeira
ALTER TABLE "homologations"
  ADD CONSTRAINT "homologations_performed_by_id_fkey"
  FOREIGN KEY ("performed_by_id")
  REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
