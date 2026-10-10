import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray package-lock.json in the home folder
  // otherwise makes Turbopack guess the wrong root.
  turbopack: { root: path.join(__dirname) },
  // cacheComponents stays OFF: @ant-design/nextjs-registry creates its CSS-in-JS
  // cache with Math.random() during render, which Cache Components rejects at
  // prerender. The portal loads data client-side, so PPR buys little here.
  // See docs/02-decisions/ADR-005-cache-components-off.md
  async redirects() {
    // proxy.ts then sends signed-out visitors on to /login
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
