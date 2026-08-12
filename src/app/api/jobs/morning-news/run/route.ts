import { assertCronAuth } from "@/lib/cron-auth";
import { json, jsonError } from "@/lib/api";
import { runMorningNewsJob } from "@/features/morningNews/morningNews.service";

export const runtime = "nodejs";

async function handle(req: Request) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    return json(await runMorningNewsJob());
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
