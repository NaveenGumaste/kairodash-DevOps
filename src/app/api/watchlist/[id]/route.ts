import { json, jsonError } from "@/lib/api";
import {
  deactivateTrackedStock,
  updateTrackedStock,
} from "@/features/watchlist/watchlist.repository";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const stock = await updateTrackedStock(id, await req.json());

    return json({ stock });
  } catch (error) {
    return jsonError(error, 400);
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const stock = await deactivateTrackedStock(id);

    return json({ stock });
  } catch (error) {
    return jsonError(error, 400);
  }
}
