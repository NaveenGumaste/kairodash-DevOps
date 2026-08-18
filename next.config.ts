import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["discord.js"],
};

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      disableLogger: true,
    })
  : nextConfig;
