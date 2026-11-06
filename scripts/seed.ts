import { prisma } from "../src/lib/db";
import { LUSE_SECURITIES } from "../src/lib/data/securities";
import { zambianHolidays } from "../src/lib/data/holidays";
import { BLOG_POSTS } from "../src/lib/data/blog";

(async () => {
  for (const s of LUSE_SECURITIES) {
    await prisma.security.upsert({
      where: { symbol: s.symbol },
      update: { name: s.name, sector: s.sector, board: s.board ?? "Main", listedYear: s.listedYear, description: s.description, currency: s.currency ?? "ZMW" },
      create: { symbol: s.symbol, name: s.name, sector: s.sector, board: s.board ?? "Main", listedYear: s.listedYear, description: s.description, currency: s.currency ?? "ZMW" },
    });
  }
  const y = new Date().getUTCFullYear();
  for (const yr of [y - 3, y - 2, y - 1, y, y + 1])
    for (const h of zambianHolidays(yr)) await prisma.tradingHoliday.upsert({ where: { date: h.date }, update: { name: h.name }, create: h });
  for (const p of BLOG_POSTS) await prisma.blogPost.upsert({ where: { slug: p.slug }, update: p, create: p });
  console.log("seeded", LUSE_SECURITIES.length, "securities,", BLOG_POSTS.length, "posts");
  await prisma.$disconnect();
})();
