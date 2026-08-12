import { assertCronAuth } from "@/lib/cron-auth";
import { json, jsonError } from "@/lib/api";
import { runFilingsJob } from "@/features/filings/filings.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    return json(await runFilingsJob());
  } catch (error) {
    return jsonError(error);
  }
}
