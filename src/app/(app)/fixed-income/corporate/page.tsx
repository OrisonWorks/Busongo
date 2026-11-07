import { prisma } from "@/lib/db";
import FiTabs from "@/components/FiTabs";
import { Card, Empty, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "LuSE Listed Bonds" };
export const revalidate = 3600;
export default async function Page() {
  const b = await prisma.listedBond.findMany({ orderBy: [{ maturityDate: "asc" }] });
  return (
    <div>
      <PageHeader title="LuSE Listed Bonds" subtitle="Corporate and supranational bonds listed on the Lusaka Securities Exchange." />
      <FiTabs active="/fixed-income/corporate" />
      <Card>{b.length ? <div className="overflow-x-auto"><table className="data"><thead><tr><th>Bond</th><th>ISIN</th><th>Issue size</th><th>Interest</th><th className="r">Tenor (y)</th><th>Issued</th><th>Matures</th><th>Status</th></tr></thead>
        <tbody>{b.map((x) => <tr key={x.id}><td className="max-w-[260px] truncate font-medium">{x.name}</td><td className="text-muted">{x.isin}</td><td>{x.value}</td><td>{x.interest}</td><td className="r">{x.tenorYears ?? "—"}</td><td>{fmtDate(x.issueDate)}</td><td>{fmtDate(x.maturityDate)}</td><td>{x.status}</td></tr>)}</tbody></table></div> : <Empty>No listed bonds stored yet.</Empty>}</Card>
    </div>
  );
}
