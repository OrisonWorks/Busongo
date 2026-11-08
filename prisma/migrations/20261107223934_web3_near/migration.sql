-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nearAccountId" TEXT;

-- CreateTable
CREATE TABLE "Proof" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "refId" TEXT,
    "hash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "network" TEXT,
    "txHash" TEXT,
    "anchoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proof_hash_key" ON "Proof"("hash");

-- CreateIndex
CREATE INDEX "Proof_kind_refId_idx" ON "Proof"("kind", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "User_nearAccountId_key" ON "User"("nearAccountId");

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

