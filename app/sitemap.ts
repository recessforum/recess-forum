import type { MetadataRoute } from "next";
import { getPosts, getCircles } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = "https://www.recessforum.com";

const STATIC_ROUTES = ["", "/circles", "/privacy", "/terms", "/support", "/child-safety"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "hourly" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }));

  const supabase = await createClient();
  const [posts, circles] = await Promise.all([
    getPosts(supabase).catch(() => []),
    getCircles(supabase).catch(() => []),
  ]);

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/post/${p.id}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const circleEntries: MetadataRoute.Sitemap = circles.map((c) => ({
    url: `${SITE_URL}/circles/${c.id}`,
    lastModified: new Date(c.createdAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries, ...circleEntries];
}
