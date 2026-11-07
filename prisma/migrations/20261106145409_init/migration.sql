-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'ADVANCED', 'PRO');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AssetClass" AS ENUM ('EQUITY', 'CRYPTO');

-- CreateTable
CREATE TABLE "Security" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isin" TEXT,
    "sector" TEXT,
    "board" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "assetClass" "AssetClass" NOT NULL DEFAULT 'EQUITY',
    "sharesOutstanding" DOUBLE PRECISION,
    "listedYear" INTEGER,
    "description" TEXT,
    "website" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceBar" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DOUBLE PRECISION,
    "high" DOUBLE PRECISION,
    "low" DOUBLE PRECISION,
    "close" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION,
    "trades" INTEGER,
    "volume" DOUBLE PRECISION,
    "value" DOUBLE PRECISION,
    "bidPrice" DOUBLE PRECISION,
    "bidQty" DOUBLE PRECISION,
    "askPrice" DOUBLE PRECISION,
    "askQty" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'luse',

    CONSTRAINT "PriceBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexBar" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION,
    "pctChange" DOUBLE PRECISION,
    "trades" INTEGER,
    "volume" DOUBLE PRECISION,
    "valueTraded" DOUBLE PRECISION,
    "marketCap" DOUBLE PRECISION,
    "marketCapExShoprite" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'luse',

    CONSTRAINT "IndexBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSummary" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "MarketSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fundamental" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'FY',
    "periodEnd" DATE,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "revenue" DOUBLE PRECISION,
    "grossProfit" DOUBLE PRECISION,
    "operatingProfit" DOUBLE PRECISION,
    "netIncome" DOUBLE PRECISION,
    "totalAssets" DOUBLE PRECISION,
    "totalLiabilities" DOUBLE PRECISION,
    "totalEquity" DOUBLE PRECISION,
    "totalDebt" DOUBLE PRECISION,
    "cash" DOUBLE PRECISION,
    "operatingCashFlow" DOUBLE PRECISION,
    "capex" DOUBLE PRECISION,
    "eps" DOUBLE PRECISION,
    "dps" DOUBLE PRECISION,
    "sharesOutstanding" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceUrl" TEXT,

    CONSTRAINT "Fundamental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateAction" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "announced" DATE,
    "exDate" DATE,
    "payDate" DATE,
    "amount" DOUBLE PRECISION,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',

    CONSTRAINT "CorporateAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "securityId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "date" DATE NOT NULL,
    "url" TEXT,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TbillAuction" (
    "id" TEXT NOT NULL,
    "auctionDate" DATE NOT NULL,
    "tenderNo" TEXT NOT NULL,
    "tenorDays" INTEGER NOT NULL,
    "isin" TEXT,
    "discountRate" DOUBLE PRECISION,
    "yield" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TbillAuction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BondAuction" (
    "id" TEXT NOT NULL,
    "auctionDate" DATE NOT NULL,
    "tenderNo" TEXT NOT NULL,
    "tenorYears" INTEGER NOT NULL,
    "isin" TEXT,
    "coupon" DOUBLE PRECISION,
    "yield" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BondAuction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListedBond" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isin" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'corporate',
    "value" TEXT,
    "interest" TEXT,
    "tenorYears" DOUBLE PRECISION,
    "issueDate" DATE,
    "maturityDate" DATE,
    "status" TEXT,

    CONSTRAINT "ListedBond_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MacroRate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "note" TEXT,

    CONSTRAINT "MacroRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingHoliday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TradingHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "rows" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "planExpiresAt" TIMESTAMP(3),
    "emailVerified" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'basic',
    "config" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "strategyId" TEXT,
    "kind" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "shareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BacktestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedScan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "shareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "months" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "provider" TEXT NOT NULL,
    "network" TEXT,
    "phone" TEXT,
    "reference" TEXT NOT NULL,
    "externalRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,
    "tag" TEXT,
    "notes" TEXT,
    "backtestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,

    CONSTRAINT "WatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "fees" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Research Desk',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Security_symbol_key" ON "Security"("symbol");

-- CreateIndex
CREATE INDEX "PriceBar_date_idx" ON "PriceBar"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PriceBar_securityId_date_key" ON "PriceBar"("securityId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "IndexBar_index_date_key" ON "IndexBar"("index", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MarketSummary_date_key" ON "MarketSummary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Fundamental_securityId_fiscalYear_period_key" ON "Fundamental"("securityId", "fiscalYear", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_title_date_key" ON "Announcement"("title", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TbillAuction_auctionDate_tenorDays_key" ON "TbillAuction"("auctionDate", "tenorDays");

-- CreateIndex
CREATE UNIQUE INDEX "BondAuction_auctionDate_tenorYears_key" ON "BondAuction"("auctionDate", "tenorYears");

-- CreateIndex
CREATE UNIQUE INDEX "ListedBond_isin_key" ON "ListedBond"("isin");

-- CreateIndex
CREATE UNIQUE INDEX "MacroRate_key_date_key" ON "MacroRate"("key", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TradingHoliday_date_key" ON "TradingHoliday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_shareId_key" ON "Strategy"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "BacktestRun_shareId_key" ON "BacktestRun"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedScan_shareId_key" ON "SavedScan"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "UsageCounter_userId_period_kind_key" ON "UsageCounter"("userId", "period", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "WatchItem_userId_symbol_key" ON "WatchItem"("userId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- AddForeignKey
ALTER TABLE "PriceBar" ADD CONSTRAINT "PriceBar_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fundamental" ADD CONSTRAINT "Fundamental_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateAction" ADD CONSTRAINT "CorporateAction_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacktestRun" ADD CONSTRAINT "BacktestRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacktestRun" ADD CONSTRAINT "BacktestRun_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedScan" ADD CONSTRAINT "SavedScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchItem" ADD CONSTRAINT "WatchItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperTrade" ADD CONSTRAINT "PaperTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
