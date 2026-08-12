import { env } from "@/lib/env";

export function assertCronAuth(req: Request) {
  const expected = env.CRON_SECRET;
  const actual = req.headers.get("authorization");

  if (!expected || actual !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  return null;
}
