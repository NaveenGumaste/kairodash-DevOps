import { json, jsonError } from "@/lib/api";
import { listGeopoliticalAlerts } from "@/features/geopolitics/geopolitics.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const alerts = await listGeopoliticalAlerts();

    return json({ alerts });
  } catch (error) {
    return jsonError(error);
  }
}
