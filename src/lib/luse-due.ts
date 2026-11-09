import { zambianHolidays } from "./data/holidays";

const LUSAKA_UTC_OFFSET_H = 2;
/** LuSE posts the day's closing prices some time after the 14:00 close; by this Lusaka hour we expect them. */
export const LUSE_POSTED_BY_HOUR = 17;
/** A complete session has prices for at least this many shares (LuSE lists ~23-25; a partial paste has far fewer). */
export const MIN_SESSION_PRICE_BARS = 15;
const DAY = 864e5;

export function isLuseTradingDay(d: Date) {
  const wd = d.getUTCDay();
  if (wd === 0 || wd === 6) return false;
  const iso = d.toISOString().slice(0, 10);
  return !zambianHolidays(d.getUTCFullYear()).some((h) => h.date.toISOString().slice(0, 10) === iso);
}

/** The latest LuSE session whose prices should be posted by `now`. */
export function expectedLuseSession(now: Date) {
  const l = new Date(now.getTime() + LUSAKA_UTC_OFFSET_H * 3600e3);
  let d = new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()));
  if (l.getUTCHours() < LUSE_POSTED_BY_HOUR) d = new Date(d.getTime() - DAY);
  while (!isLuseTradingDay(d)) d = new Date(d.getTime() - DAY);
  return d;
}
