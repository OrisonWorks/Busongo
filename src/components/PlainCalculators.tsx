"use client";
import { useId, useState } from "react";
import { fill } from "@/lib/i18n/fill";
import { priceGrowth, type Pt } from "@/lib/plain";
import { tbillNet } from "@/lib/fi";
import { fmt, kwacha } from "@/lib/format";

type S = Record<string, string>;
const num = (v: string) => { const n = Number(v.replace(/,/g, "")); return Number.isFinite(n) && n >= 0 ? n : 0; };

function Field({ label, children }: { label: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return <div><label htmlFor={id} className="label text-sm">{label}</label>{children(id)}</div>;
}

export default function PlainCalculators({ s, inflation, today, tenors, wht, fx }: { s: S; inflation: Pt[]; today: string; tenors: { days: number; yield: number }[]; wht: number; fx: number | null }) {
  const firstYear = inflation.length ? Number(inflation[0].date.slice(0, 4)) + 1 : null;
  const thisYear = Number(today.slice(0, 4));
  const [amt, setAmt] = useState("100");
  const [year, setYear] = useState(String(Math.max(firstYear ?? thisYear, thisYear - 5)));
  const [lend, setLend] = useState("1000");
  const [days, setDays] = useState(String(tenors.at(-1)?.days ?? 364));
  const [usd, setUsd] = useState("1");
  const [zmw, setZmw] = useState(fx ? (fx).toFixed(2) : "");
  const tenor = tenors.find((x) => String(x.days) === days);
  const tb = tenor ? tbillNet(num(lend), tenor.yield, tenor.days, wht) : null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {firstYear && (
        <section className="card p-4" aria-labelledby="calc-inf">
          <h3 id="calc-inf" className="font-semibold">{s["calc.inflation.title"]}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label={s["calc.inflation.amount"]}>{(id) => <input id={id} className="input text-base" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} />}</Field>
            <Field label={s["calc.inflation.year"]}>{(id) => <select id={id} className="input text-base" value={year} onChange={(e) => setYear(e.target.value)}>{Array.from({ length: thisYear - firstYear }, (_, i) => thisYear - 1 - i).map((y) => <option key={y}>{y}</option>)}</select>}</Field>
          </div>
          <output aria-live="polite" className="mt-3 block text-base">{fill(s["calc.inflation.result"], { amount: kwacha(num(amt)), year, now: kwacha(num(amt) * priceGrowth(inflation, `${year}-07-01`, today)) })}</output>
        </section>
      )}
      {tenors.length > 0 && (
        <section className="card p-4" aria-labelledby="calc-tb">
          <h3 id="calc-tb" className="font-semibold">{s["calc.tbill.title"]}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label={s["calc.tbill.amount"]}>{(id) => <input id={id} className="input text-base" inputMode="decimal" value={lend} onChange={(e) => setLend(e.target.value)} />}</Field>
            <Field label={s["calc.tbill.tenor"]}>{(id) => <select id={id} className="input text-base" value={days} onChange={(e) => setDays(e.target.value)}>{tenors.map((x) => <option key={x.days} value={x.days}>{fill(s["calc.tbill.days"], { n: x.days })}</option>)}</select>}</Field>
          </div>
          {tb && <output aria-live="polite" className="mt-3 block text-base">{fill(s["calc.tbill.result"], { back: kwacha(num(lend) + tb.net), tax: fmt(wht, 0), gain: kwacha(tb.net) })}</output>}
        </section>
      )}
      {fx && (
        <section className="card p-4" aria-labelledby="calc-fx">
          <h3 id="calc-fx" className="font-semibold">{s["calc.fx.title"]}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label={s["calc.fx.usd"]}>{(id) => <input id={id} className="input text-base" inputMode="decimal" value={usd} onChange={(e) => { setUsd(e.target.value); setZmw((num(e.target.value) * fx).toFixed(2)); }} />}</Field>
            <Field label={s["calc.fx.zmw"]}>{(id) => <input id={id} className="input text-base" inputMode="decimal" value={zmw} onChange={(e) => { setZmw(e.target.value); setUsd((num(e.target.value) / fx).toFixed(2)); }} />}</Field>
          </div>
          <p className="mt-3 text-sm text-muted">{fill(s["calc.fx.note"], { rate: kwacha(fx, 4) })}</p>
        </section>
      )}
    </div>
  );
}
