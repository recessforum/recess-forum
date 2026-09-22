import type { MetadataRoute } from "next";

const SITE_URL = "https://www.recessforum.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/settings", "/api/", "/login", "/signup", "/welcome", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
