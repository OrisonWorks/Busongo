function easter(y: number) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}
const D = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const add = (d: Date, n: number) => new Date(+d + n * 86400000);
const firstMonday = (y: number, m: number) => {
  const d = D(y, m, 1);
  return add(d, (8 - d.getUTCDay()) % 7);
};

// Zambian public holidays (Public Holidays Act, Cap. 272). A holiday on a Sunday is observed on the Monday.
export function zambianHolidays(y: number): { date: Date; name: string }[] {
  const e = easter(y);
  const heroes = firstMonday(y, 7);
  const list = [
    { date: D(y, 1, 1), name: "New Year's Day" },
    { date: D(y, 3, 8), name: "International Women's Day" },
    { date: D(y, 3, 12), name: "Youth Day" },
    { date: add(e, -2), name: "Good Friday" },
    { date: add(e, -1), name: "Holy Saturday" },
    { date: add(e, 1), name: "Easter Monday" },
    { date: D(y, 4, 28), name: "Kenneth Kaunda Day" },
    { date: D(y, 5, 1), name: "Labour Day" },
    { date: D(y, 5, 25), name: "Africa Freedom Day" },
    { date: heroes, name: "Heroes' Day" },
    { date: add(heroes, 1), name: "Unity Day" },
    { date: firstMonday(y, 8), name: "Farmers' Day" },
    { date: D(y, 10, 18), name: "National Day of Prayer" },
    { date: D(y, 10, 24), name: "Independence Day" },
    { date: D(y, 12, 25), name: "Christmas Day" },
  ];
  const out = [...list];
  for (const h of list) if (h.date.getUTCDay() === 0) out.push({ date: add(h.date, 1), name: `${h.name} (observed)` });
  return out.sort((a, b) => +a.date - +b.date);
}
