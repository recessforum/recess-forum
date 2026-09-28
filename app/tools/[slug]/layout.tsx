import type { Metadata } from "next";
import { TOOL_BY_SLUG } from "@/lib/tools";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TOOL_BY_SLUG[slug];
  return t ? { title: `${t.title} (free)`, description: t.description } : {};
}

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
