/*
  Warnings:

  - Added the required column `municipality_id` to the `school_units` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "school_units" ADD COLUMN     "municipality_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "nte" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "nte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nte_id" INTEGER NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_nte_id_fkey" FOREIGN KEY ("nte_id") REFERENCES "nte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_units" ADD CONSTRAINT "school_units_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
