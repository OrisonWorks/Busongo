import { dataStatus } from "@/lib/market";
import { Notice } from "./ui";
import { fmtDate } from "@/lib/format";

export default async function DataNotice({ need = 60 }: { need?: number }) {
  const s = await dataStatus();
  if (s.equitySessions >= need) return null;
  return (
    <Notice>
      LuSE history available: <b>{s.equitySessions}</b> session{s.equitySessions === 1 ? "" : "s"} ({fmtDate(s.equityFirst)} – {fmtDate(s.equityLast)}). LuSE does not publish historical prices, so history builds up daily from the exchange&apos;s end-of-day data (admins can import older history as CSV). Indicators that need longer look-backs show results once enough sessions are stored. Crypto has full multi-year history.
    </Notice>
  );
}
