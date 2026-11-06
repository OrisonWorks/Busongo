import { prisma } from "./db";

export const ALERT_METRICS = [
  { id: "close", label: "Closing price" },
  { id: "changePct", label: "Daily % change" },
  { id: "volume", label: "Volume traded" },
  { id: "value", label: "Value traded (K)" },
] as const;
export const ALERT_OPS = [
  { id: "gt", label: "rises above" },
  { id: "lt", label: "falls below" },
] as const;

export async function evaluateAlerts() {
  const alerts = await prisma.alert.findMany({ where: { active: true }, include: { security: true } });
  let fired = 0;
  for (const a of alerts) {
    const bars = await prisma.priceBar.findMany({ where: { securityId: a.securityId }, orderBy: { date: "desc" }, take: 2 });
    if (!bars.length) continue;
    const [b, prev] = bars;
    const v =
      a.metric === "close" ? b.close
      : a.metric === "changePct" ? (prev ? (b.close / prev.close - 1) * 100 : null)
      : a.metric === "volume" ? b.volume
      : b.value;
    if (v == null) continue;
    const hit = a.operator === "gt" ? v > a.threshold : v < a.threshold;
    if (!hit) continue;
    fired++;
    await prisma.$transaction([
      prisma.alert.update({ where: { id: a.id }, data: { active: false, triggeredAt: new Date() } }),
      prisma.notification.create({
        data: {
          userId: a.userId,
          title: `${a.security.symbol} alert triggered`,
          body: `${a.security.symbol} ${a.metric} is ${v.toFixed(2)} (${a.operator === "gt" ? "above" : "below"} ${a.threshold}) on ${b.date.toISOString().slice(0, 10)}.`,
        },
      }),
    ]);
  }
  return fired;
}
