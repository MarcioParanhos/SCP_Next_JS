CREATE TABLE IF NOT EXISTS "eixos" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "eixos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "courses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "eixo_id" INTEGER NOT NULL,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "courses" ADD CONSTRAINT "courses_eixo_id_fkey" FOREIGN KEY ("eixo_id") REFERENCES "eixos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
