import { assertCronAuth } from "@/lib/cron-auth";
import { json, jsonError } from "@/lib/api";
import { runGeopoliticsJob } from "@/features/geopolitics/geopolitics.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    return json(await runGeopoliticsJob());
  } catch (error) {
    return jsonError(error);
  }
}
