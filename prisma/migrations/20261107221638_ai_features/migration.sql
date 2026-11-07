-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "summarizedAt" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "DailyBrief" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'template',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyBrief_date_key" ON "DailyBrief"("date");
