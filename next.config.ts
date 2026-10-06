import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  // Numer wersji z package.json i skrót commitu (Vercel) wpisane w build,
  // żeby panel pokazywał, co jest wdrożone. Historia wersji: ROADMAP.md.
  env: {
    APP_VERSION: pkg.version,
    APP_COMMIT: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7),
  },
};

export default nextConfig;
