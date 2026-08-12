import { json, jsonError } from "@/lib/api";
import { fetchStockNews } from "@/features/stocks/stockNews.service";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol } = await context.params;
    const news = await fetchStockNews(symbol);

    return json({ news });
  } catch (error) {
    return jsonError(error, 400);
  }
}
