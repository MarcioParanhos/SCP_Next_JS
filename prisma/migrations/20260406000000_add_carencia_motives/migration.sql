-- Cria o enum para diferenciar motivos de carencia real e temporaria
CREATE TYPE "CarenciaType" AS ENUM ('REAL', 'TEMPORARY');

-- Cria a tabela de motivos de carencia
CREATE TABLE "carencia_motives" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "CarenciaType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carencia_motives_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "carencia_motives_code_key" ON "carencia_motives"("code");
