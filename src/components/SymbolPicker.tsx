export default function SymbolPicker({ symbols, value, extra }: { symbols: { symbol: string; name: string; group: string }[]; value: string; extra?: React.ReactNode }) {
  return (
    <form className="mb-4 flex flex-wrap items-end gap-2">
      <div><label className="label">Symbol</label>
        <select name="symbol" defaultValue={value} className="input">{[...new Set(symbols.map((s) => s.group))].map((g) => <optgroup key={g} label={g}>{symbols.filter((s) => s.group === g).map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol} · {s.name}</option>)}</optgroup>)}</select></div>
      {extra}
      <button className="btn btn-primary">Show</button>
    </form>
  );
}
