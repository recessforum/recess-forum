import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Silences a warning from Turbopack finding package-lock.json higher up
    // in ~/Downloads/files, which holds sibling prototype projects, not this one.
    root: path.join(__dirname),
  },
  async redirects() {
    // The founding program grew from 100 to 500 parents; the old link was
    // already shared on Instagram.
    return [{ source: "/founding-100", destination: "/founding", permanent: true }];
  },
};

export default nextConfig;
