"use client";
import { useEffect, useRef } from "react";
import { CandlestickSeries, ColorType, createChart, HistogramSeries, LineSeries, type IChartApi, type Time } from "lightweight-charts";

export type Overlay = { name: string; color: string; data: { date: string; value: number | null }[] };
export type Marker = { date: string; kind: "buy" | "sell"; text?: string };

export default function PriceChart({ bars, overlays = [], height = 420, line = false, markers = [], levels = [] }: {
  bars: { date: string; open: number; high: number; low: number; close: number; volume: number }[];
  overlays?: Overlay[];
  height?: number;
  line?: boolean;
  markers?: Marker[];
  levels?: { price: number; color: string; title: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart: IChartApi = createChart(ref.current, {
      height,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#8a96b0" },
      grid: { vertLines: { color: "#162036" }, horzLines: { color: "#162036" } },
      rightPriceScale: { borderColor: "#1e2a44" },
      timeScale: { borderColor: "#1e2a44" },
      autoSize: true,
    });
    const t = (d: string) => d as Time;
    const main = line
      ? chart.addSeries(LineSeries, { color: "#10b981", lineWidth: 2 })
      : chart.addSeries(CandlestickSeries, { upColor: "#22c55e", downColor: "#ef4444", borderVisible: false, wickUpColor: "#22c55e", wickDownColor: "#ef4444" });
    main.setData(bars.map((b) => (line ? { time: t(b.date), value: b.close } : { time: t(b.date), open: b.open, high: b.high, low: b.low, close: b.close })) as never);
    const vol = chart.addSeries(HistogramSeries, { priceScaleId: "vol", color: "#334155", priceFormat: { type: "volume" } });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    vol.setData(bars.map((b) => ({ time: t(b.date), value: b.volume, color: b.close >= b.open ? "#22c55e55" : "#ef444455" })));
    for (const o of overlays) {
      const s = chart.addSeries(LineSeries, { color: o.color, lineWidth: 1, title: o.name, priceLineVisible: false, lastValueVisible: false });
      s.setData(o.data.filter((d) => d.value != null).map((d) => ({ time: t(d.date), value: d.value as number })));
    }
    for (const l of levels) main.createPriceLine({ price: l.price, color: l.color, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: l.title });
    if (markers.length) {
      import("lightweight-charts").then(({ createSeriesMarkers }) =>
        createSeriesMarkers(main, markers.map((m) => ({ time: t(m.date), position: m.kind === "buy" ? "belowBar" : "aboveBar", color: m.kind === "buy" ? "#22c55e" : "#ef4444", shape: m.kind === "buy" ? "arrowUp" : "arrowDown", text: m.text ?? (m.kind === "buy" ? "B" : "S") })) as never),
      );
    }
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [bars, overlays, height, line, markers, levels]);
  return <div ref={ref} style={{ height }} className="w-full" />;
}
