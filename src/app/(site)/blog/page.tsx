import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui";
export const metadata = { title: "Blog" };
export const revalidate = 3600;
export default async function Page() {
  const posts = await prisma.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16">
      <h1 className="text-4xl font-bold">Blog</h1>
      <p className="mt-2 text-muted">Guides on backtesting, LuSE investing and Zambian fixed income.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="card p-6 hover:border-brand/40">
            <Badge color="green">{p.category}</Badge>
            <h2 className="mt-3 text-xl font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-muted">{p.excerpt}</p>
            <div className="mt-4 text-xs text-muted">{p.author} · {fmtDate(p.publishedAt)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
