import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Silences a warning from Turbopack finding package-lock.json higher up
    // in ~/Downloads/files, which holds sibling prototype projects, not this one.
    root: path.join(__dirname),
  },
};

export default nextConfig;
