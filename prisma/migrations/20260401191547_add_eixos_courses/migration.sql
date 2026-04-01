-- AlterTable
ALTER TABLE "employees" RENAME CONSTRAINT "servidores_pkey" TO "employees_pkey";
ALTER TABLE "employees" ALTER COLUMN "enrollment" SET DEFAULT 'PENDING';
ALTER TABLE "employees" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "eixos" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "eixos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "eixo_id" INTEGER NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_eixo_id_fkey" FOREIGN KEY ("eixo_id") REFERENCES "eixos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
