-- CreateTable
CREATE TABLE "school_units" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sec_cod" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "school_units_pkey" PRIMARY KEY ("id")
);
