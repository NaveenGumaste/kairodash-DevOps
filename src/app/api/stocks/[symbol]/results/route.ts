import { json, jsonError } from "@/lib/api";
import { fetchFilingsForSymbol } from "@/features/filings/filings.service";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol } = await context.params;
    const results = (await fetchFilingsForSymbol(symbol)).filter(
      (filing) => filing.itemType === "result",
    );

    return json({ results });
  } catch (error) {
    return jsonError(error, 400);
  }
}
