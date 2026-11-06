import Prose from "@/components/Prose";
import { LEGAL } from "@/lib/data/legal";
export const metadata = { title: LEGAL.privacy.title };
export default function Page() {
  return <div className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-4xl font-bold">{LEGAL.privacy.title}</h1><Prose md={LEGAL.privacy.md} /></div>;
}
