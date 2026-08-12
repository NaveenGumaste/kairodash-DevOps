import { json, jsonError } from "@/lib/api";
import {
  createTrackedStock,
  listTrackedStocks,
} from "@/features/watchlist/watchlist.repository";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active") !== "false";
    const stocks = await listTrackedStocks({ activeOnly });

    return json({ stocks });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const stock = await createTrackedStock(await req.json());

    return json({ stock }, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
