import { appwriteStatus, env } from "@/lib/env";
import { json, jsonError } from "@/lib/api";
import { listQueueJobs } from "@/features/queue/queue.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safe<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const [jobs] = await Promise.all([
      safe(listQueueJobs(20), []),
    ]);
    const failedJobs = jobs.filter((job) => job.status === "failed").length;

    return json({
      ok: true,
      appwrite: appwriteStatus(),
      timezone: env.TIMEZONE,
      queue: {
        recent: jobs.length,
        failed: failedJobs,
      },
      providers: {
        newsapi: Boolean(env.NEWSAPI_KEY),
        marketaux: Boolean(env.MARKETAUX_API_KEY),
        smartapi: Boolean(
          env.SMARTAPI_API_KEY &&
            env.SMARTAPI_CLIENT_ID &&
            env.SMARTAPI_PASSWORD &&
            env.SMARTAPI_TOTP_SECRET,
        ),
        discord: Boolean(env.DISCORD_TOKEN),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
