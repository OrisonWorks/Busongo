import Link from "next/link";
import type { Quote } from "@/lib/market";
import { Chg } from "./ui";
import { ccy, compact, fmtInt } from "@/lib/format";

export default function QuoteTable({ rows, base = "/stocks", showSector = true }: { rows: Quote[]; base?: string; showSector?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="data">
        <thead><tr><th>Symbol</th><th>Name</th>{showSector && <th>Sector</th>}<th className="r">Close</th><th className="r">Change</th><th className="r">% Chg</th><th className="r">Volume</th><th className="r">Value</th><th className="r">Trades</th><th className="r">Bid</th><th className="r">Ask</th></tr></thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.symbol}>
              <td><Link href={`${base}/${q.symbol}`} className="font-semibold text-brand">{q.symbol}</Link></td>
              <td className="max-w-[220px] truncate text-muted">{q.name}</td>
              {showSector && <td className="text-muted">{q.sector}</td>}
              <td className="num r">{ccy(q.currency, q.close)}</td>
              <td className="num r">{q.change == null ? "—" : q.change.toFixed(2)}</td>
              <td className="r"><Chg v={q.changePct} /></td>
              <td className="num r">{compact(q.volume)}</td>
              <td className="num r">{compact(q.value)}</td>
              <td className="num r">{fmtInt(q.trades)}</td>
              <td className="num r">{q.bid ?? "—"}</td>
              <td className="num r">{q.ask ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
