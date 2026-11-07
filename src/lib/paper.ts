export const PAPER_START = 100000;

type PaperFill = { symbol: string; side: string; quantity: number; price: number; fees: number };

export function paperBook(chronological: PaperFill[]) {
  let cash = PAPER_START;
  const pos = new Map<string, { q: number; cost: number }>();
  for (const t of chronological) {
    const p = pos.get(t.symbol) || { q: 0, cost: 0 };
    if (t.side === "BUY") { cash -= t.quantity * t.price + t.fees; p.cost += t.quantity * t.price + t.fees; p.q += t.quantity; }
    else { cash += t.quantity * t.price - t.fees; p.cost -= p.q ? (p.cost / p.q) * t.quantity : 0; p.q -= t.quantity; }
    pos.set(t.symbol, p);
  }
  return { cash, pos };
}
