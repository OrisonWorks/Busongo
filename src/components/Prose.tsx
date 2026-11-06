import { marked } from "marked";

export default function Prose({ md }: { md: string }) {
  return <div className="prose-dark" dangerouslySetInnerHTML={{ __html: marked.parse(md, { async: false }) as string }} />;
}
