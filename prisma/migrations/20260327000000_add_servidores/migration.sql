-- Migration: 20260327000000_add_servidores
-- Descrição: Cria a tabela "servidores" para armazenar o cadastro de servidores públicos.
-- Campos:
--   id        -> Chave primária auto-incrementada
--   name      -> Nome completo do servidor
--   cpf       -> CPF do servidor (formato livre, validado na aplicação)
--   matricula -> Matrícula funcional (padrão: PENDENTE até atribuição)
--   vinculo   -> Tipo de vínculo (ex: REDA, EFETIVO, DESIGNADO, TEMPORÁRIO)
--   regime    -> Regime de trabalho (ex: 20H, 40H, DE)
--   createdAt -> Data/hora do cadastro (gerada automaticamente)
--   updatedAt -> Data/hora da última atualização (gerenciada pelo Prisma)

-- CreateTable
CREATE TABLE "servidores" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "matricula" TEXT NOT NULL DEFAULT 'PENDENTE',
    "vinculo" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servidores_pkey" PRIMARY KEY ("id")
);
