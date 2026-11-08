-- CreateTable
CREATE TABLE "StableYield" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pool" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "apy" DOUBLE PRECISION NOT NULL,
    "apyBase" DOUBLE PRECISION,
    "apyReward" DOUBLE PRECISION,
    "tvlUsd" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StableYield_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StableYield_date_idx" ON "StableYield"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StableYield_date_pool_key" ON "StableYield"("date", "pool");
