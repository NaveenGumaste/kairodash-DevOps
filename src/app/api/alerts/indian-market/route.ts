import { json, jsonError } from "@/lib/api";
import { listIndianMarketEvents } from "@/features/indianMarket/indianMarket.repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const alerts = await listIndianMarketEvents();

    return json({ alerts });
  } catch (error) {
    return jsonError(error);
  }
}
