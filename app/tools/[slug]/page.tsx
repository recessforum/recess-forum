"use client";

import { Suspense } from "react";
import { notFound, useParams } from "next/navigation";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { ToolPage } from "@/components/tools/ToolPage";

export default function ToolRoute() {
  const { slug } = useParams<{ slug: string }>();
  if (!TOOL_BY_SLUG[slug]) notFound();
  return <Suspense><ToolPage slug={slug} /></Suspense>;
}
