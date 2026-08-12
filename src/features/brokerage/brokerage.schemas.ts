import { z } from "zod";

export const BrokerageFeesSchema = z.object({
	percentage: z.number(),
	maxFlat: z.number().optional(),
});

export const BrokerConfigSchema = z.object({
	id: z.string(),
	name: z.string(),
	pricingUrl: z.string().url(),
	dpCharge: z.number().optional(), // Deprecated
	dpChargeType: z.enum(["per_scrip", "per_order", "percentage"]).optional(), // Deprecated
	dpChargeConfig: z.object({
		brokerFee: z.number(),
		depositoryFee: z.number(),
		isPerISIN: z.boolean(),
		gstIncluded: z.boolean().default(false),
	}).optional(),
	equityDelivery: BrokerageFeesSchema,
	equityIntraday: BrokerageFeesSchema,
	futures: BrokerageFeesSchema,
	options: BrokerageFeesSchema,
	commodity: BrokerageFeesSchema.optional(),
	currency: BrokerageFeesSchema.optional(),
	mtf: BrokerageFeesSchema.optional(),
	updatedAt: z.string().optional(),
});

export const BrokerAuditLogSchema = z.object({
	$id: z.string().optional(),
	brokerId: z.string(),
	brokerName: z.string(),
	changedAt: z.string(), // ISO timestamp
	source: z.string(), // "admin" | "scraper"
	changes: z.string(), // JSON string of { field, from, to }[]
});

export type BrokerConfig = z.infer<typeof BrokerConfigSchema>;
export type BrokerageFees = z.infer<typeof BrokerageFeesSchema>;
export type BrokerAuditLog = z.infer<typeof BrokerAuditLogSchema>;

export interface AuditLogChange {
	field: string;
	from: unknown;
	to: unknown;
}

