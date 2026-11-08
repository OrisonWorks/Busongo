"use client";
import { usePathname } from "next/navigation";

export default function HideOnEmbed({ children }: { children: React.ReactNode }) {
  return usePathname()?.startsWith("/embed/") ? null : <>{children}</>;
}
