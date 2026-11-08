import { SERIES } from "@/lib/feed";
import { brand } from "@/config/brand";

export const metadata = { title: "Open data", description: "Free LASI, GRZ T-bill and bond yields, and Bank of Zambia rates as JSON, CSV and embeddable charts." };

export default function Page() {
  const base = brand.siteUrl;
  const snippet = `<iframe src="${base}/embed/lasi" width="600" height="320" style="border:0" loading="lazy" title="LASI via ${brand.name}"></iframe>`;
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16">
      <h1 className="text-4xl font-bold">Open data</h1>
      <p className="mt-3 max-w-3xl text-muted">Zambian market summary data, free for anyone to use: the LASI, GRZ T-bill and bond auction yields, and Bank of Zambia rates. Use it in research, articles, classrooms and apps, with no key or sign-up. Please credit &quot;{brand.name}&quot; with a link back.</p>

      <div className="card mt-8 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-muted"><tr><th className="p-3">Series</th><th className="p-3">Source</th><th className="p-3">Get it</th></tr></thead>
          <tbody>
            {SERIES.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="p-3"><div className="font-medium">{s.title}</div><code className="text-xs text-muted">{s.id}</code></td>
                <td className="p-3 text-muted">{s.source}</td>
                <td className="whitespace-nowrap p-3"><a className="text-brand" href={`/api/v1/${s.id}`}>JSON</a> · <a className="text-brand" href={`/api/v1/${s.id}.csv`}>CSV</a> · <a className="text-brand" href={`/embed/${s.id}`} target="_blank" rel="noopener">Chart</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl font-bold">API</h2>
      <pre className="card mt-3 overflow-x-auto p-4 text-xs">{`GET ${base}/api/v1                 list of series
GET ${base}/api/v1/lasi            JSON: { series, title, unit, source, columns, rows: [{ date, value, pctChange }] }
GET ${base}/api/v1/tbills.csv      CSV, one row per auction date
GET ${base}/api/v1/usdzmw?from=2025-01-01   only rows on or after a date`}</pre>
      <p className="mt-2 text-sm text-muted">Responses are cached for an hour and allow cross-origin requests, so you can call them straight from a browser.</p>

      <h2 className="mt-12 text-2xl font-bold">Embed a chart</h2>
      <p className="mt-2 text-muted">Paste this into any web page. Swap <code>lasi</code> for any series above, and add <code>?from=YYYY-MM-DD</code> to shorten the range.</p>
      <pre className="card mt-3 overflow-x-auto p-4 text-xs">{snippet}</pre>
      <iframe src="/embed/lasi" className="card mt-4 h-[320px] w-full max-w-[600px] p-0" style={{ border: 0 }} loading="lazy" title="LASI chart preview" />

      <h2 className="mt-12 text-2xl font-bold">Terms</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
        <li>Free to use with credit to {brand.name}. Only index-level and official summary figures are published here, not individual stock prices.</li>
        <li>Figures come from public LuSE and Bank of Zambia releases. They may be delayed or contain errors, and are provided as is.</li>
        <li>For research and education only. Nothing here is investment advice.</li>
      </ul>
    </div>
  );
}
