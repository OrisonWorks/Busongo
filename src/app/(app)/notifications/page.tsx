import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { markNotificationsRead } from "../actions";
import { Card, Empty, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Notifications" };
export default async function Page() {
  const u = await requireUser("/notifications");
  const n = await prisma.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <PageHeader title="Notifications"><form action={markNotificationsRead}><button className="btn btn-ghost">Mark all read</button></form></PageHeader>
      <Card>{n.length ? n.map((x) => <div key={x.id} className={`border-b border-line/50 py-3 last:border-0 ${x.read ? "opacity-60" : ""}`}><div className="font-medium">{!x.read && "● "}{x.title}</div><div className="text-sm text-muted">{x.body}</div><div className="text-xs text-muted">{fmtDate(x.createdAt)}</div></div>) : <Empty>No notifications yet.</Empty>}</Card>
    </div>
  );
}
