import { z } from "zod";

export const stockSymbolSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z0-9&.-]{1,20}$/.test(value), {
    message: "Invalid stock symbol",
  });

export const bseCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "BSE code must be a 6-digit scrip code");

export const exchangeSchema = z.enum(["NSE", "BSE"]);

const trackedStockBaseSchema = z.object({
  symbol: stockSymbolSchema,
  exchanges: z.array(exchangeSchema).min(1),
  bseCode: bseCodeSchema.optional().or(z.literal("")).transform((value) =>
    value === "" ? undefined : value,
  ),
  companyName: z.string().trim().min(1).max(120),
  aliases: z.array(z.string().trim().min(1).max(120)).default([]),
  isActive: z.boolean().default(true),
});

function requireBseCodeWhenNeeded(
  value: { exchanges?: Exchange[]; bseCode?: string },
  ctx: z.RefinementCtx,
) {
  if (value.exchanges?.includes("BSE") && !value.bseCode) {
    ctx.addIssue({
      code: "custom",
      path: ["bseCode"],
      message: "BSE code is required when BSE is selected",
    });
  }
}

export const trackedStockCreateSchema = trackedStockBaseSchema.superRefine(
  requireBseCodeWhenNeeded,
);

export const trackedStockUpdateSchema = trackedStockBaseSchema
  .partial()
  .superRefine(requireBseCodeWhenNeeded);

export type Exchange = z.infer<typeof exchangeSchema>;
export type TrackedStockInput = {
  symbol: string;
  exchanges: Exchange[];
  bseCode?: string;
  companyName: string;
  aliases: string[];
  isActive: boolean;
};

export type TrackedStock = TrackedStockInput & {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function normalizeExchanges(exchanges: unknown[]): Exchange[] {
  const normalized = exchanges.filter(
    (exchange): exchange is Exchange => exchange === "NSE" || exchange === "BSE",
  );

  return [...new Set(normalized)];
}

export function parseExchangeChoice(value: "NSE" | "BSE" | "BOTH"): Exchange[] {
  if (value === "BOTH") {
    return ["NSE", "BSE"];
  }

  return [value];
}
