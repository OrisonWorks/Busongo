"use client";
import { useState } from "react";
import { bondDuration, bondPrice, bondYield, realYield, tbillNet, tbillPriceFromDiscount, tbillPriceFromYield } from "@/lib/fi";
import { fmt } from "@/lib/format";

const In = ({ l, v, s }: { l: string; v: number; s: (n: number) => void }) => <div><label className="label">{l}</label><input type="number" step="any" className="input" value={v} onChange={(e) => s(+e.target.value)} /></div>;
const Row = ({ l, v }: { l: string; v: string }) => <div className="flex justify-between border-b border-line/50 py-1.5 text-sm"><span className="text-muted">{l}</span><span className="num font-semibold">{v}</span></div>;

export default function FiCalculators({ defaults }: { defaults: { tbYield: number; tbDays: number; bondCoupon: number; bondYield: number; bondYears: number; inflation: number; wht: number } }) {
  const [inv, setInv] = useState(10000);
  const [ty, setTy] = useState(defaults.tbYield);
  const [td, setTd] = useState(defaults.tbDays);
  const [disc, setDisc] = useState(0);
  const [wht, setWht] = useState(defaults.wht);
  const [cp, setCp] = useState(defaults.bondCoupon);
  const [by, setBy] = useState(defaults.bondYield);
  const [yrs, setYrs] = useState(defaults.bondYears);
  const [px, setPx] = useState(100);
  const [inf, setInf] = useState(defaults.inflation);
  const t = tbillNet(inv, ty, td, wht);
  const d = bondDuration(cp, by, yrs);
  const face = 100;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-3 p-4">
        <div className="font-semibold">T-bill return</div>
        <div className="grid grid-cols-2 gap-2"><In l="Amount invested (K)" v={inv} s={setInv} /><In l="Tenor (days)" v={td} s={setTd} /><In l="Yield %" v={ty} s={setTy} /><In l="Withholding tax %" v={wht} s={setWht} /></div>
        <Row l="Price per K100" v={fmt(tbillPriceFromYield(ty, td), 4)} /><Row l="Face value at maturity" v={`K${fmt(t.face)}`} /><Row l="Gross interest" v={`K${fmt(t.interest)}`} /><Row l="Withholding tax" v={`K${fmt(t.tax)}`} /><Row l="Net interest" v={`K${fmt(t.net)}`} /><Row l="Net annualised yield" v={`${fmt(t.netYield)}%`} />
        <div className="grid grid-cols-2 gap-2"><In l="Or: discount rate %" v={disc} s={setDisc} /><div className="self-end text-sm">Price {disc ? fmt(tbillPriceFromDiscount(disc, td), 4) : "—"}</div></div>
      </div>
      <div className="card space-y-3 p-4">
        <div className="font-semibold">Bond price & duration</div>
        <div className="grid grid-cols-3 gap-2"><In l="Coupon %" v={cp} s={setCp} /><In l="Yield %" v={by} s={setBy} /><In l="Years" v={yrs} s={setYrs} /></div>
        <Row l="Clean price per K100" v={fmt(bondPrice(cp, by, yrs), 4)} /><Row l="Semi-annual coupon per K100" v={`K${fmt(cp / 2)}`} /><Row l="Macaulay duration" v={`${fmt(d.macaulay)} yrs`} /><Row l="Modified duration" v={`${fmt(d.modified)}`} /><Row l="Price change for +100bp" v={`${fmt(-d.modified)}%`} />
        <div className="grid grid-cols-2 gap-2"><In l="Price → yield" v={px} s={setPx} /><div className="self-end text-sm">YTM {fmt(bondYield(px, cp, yrs))}%</div></div>
        <p className="text-xs text-muted">Assumes semi-annual coupons, face K{face}, pricing on a coupon date.</p>
      </div>
      <div className="card space-y-3 p-4">
        <div className="font-semibold">Real yield</div>
        <div className="grid grid-cols-2 gap-2"><In l="Nominal yield %" v={by} s={setBy} /><In l="Inflation %" v={inf} s={setInf} /></div>
        <Row l="Real yield (Fisher)" v={`${fmt(realYield(by, inf))}%`} /><Row l="After-tax real yield" v={`${fmt(realYield(by * (1 - wht / 100), inf))}%`} />
        <p className="text-xs text-muted">Withholding tax rates change with the national budget. Check the current ZRA rate before investing.</p>
      </div>
    </div>
  );
}
