import { assertCronAuth } from "@/lib/cron-auth";
import { json, jsonError } from "@/lib/api";
import { enqueueJob } from "@/features/queue/queue.repository";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const job = await enqueueJob({
      name: "indian-market",
      payload: body,
      maxAttempts: 3,
      runAt: new Date(),
    });

    return json({ job }, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
