import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Prose from "@/components/Prose";
import { fmtDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await prisma.blogPost.findUnique({ where: { slug: (await params).slug } });
  return p ? { title: p.title, description: p.excerpt } : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = await prisma.blogPost.findUnique({ where: { slug: (await params).slug } });
  if (!p || !p.published) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/blog" className="text-sm text-muted hover:text-fg">← Blog</Link>
      <h1 className="mt-4 text-4xl font-bold">{p.title}</h1>
      <div className="mt-2 text-sm text-muted">{p.category} · {p.author} · {fmtDate(p.publishedAt)}</div>
      <Prose md={p.content} />
    </article>
  );
}
