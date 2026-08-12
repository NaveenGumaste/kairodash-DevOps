import "server-only";

import { ID, Query } from "appwrite";
import { getDatabaseId, getDatabases } from "@/lib/appwrite";
import { appwriteStatus, collections } from "@/lib/env";
import { DEFAULT_BROKERS } from "./default-brokers";
import { AuditLogChange, BrokerAuditLog, BrokerConfig, BrokerConfigSchema } from "./brokerage.schemas";
import { rDel, rGet, rSet } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";

const collectionId = collections.brokerageConfigs;
const auditCollectionId = collections.brokerageAuditLogs;

// ── Types ───────────────────────────────────────────────────────────────────

type BrokerConfigDocument = {
	$id: string;
	$updatedAt?: string;
	brokerId: string;
	name: string;
	pricingUrl: string;
	dpCharge: number;
	dpChargeType: BrokerConfig["dpChargeType"];
	equityDelivery?: string;
	equityIntraday?: string;
	futures?: string;
	options?: string;
	commodity?: string;
	currency?: string;
	mtf?: string;
	dpChargeConfig?: string;
};

type AuditLogDocument = {
	$id: string;
	$createdAt?: string;
	brokerId: string;
	brokerName: string;
	changedAt: string;
	source: string;
	changes: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseFeeRule(value: string | undefined, fallback: unknown) {
	if (!value) return fallback;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
}

function mapBrokerConfig(document: BrokerConfigDocument): BrokerConfig {
	const fallback =
		DEFAULT_BROKERS.find((broker) => broker.id === document.brokerId) ??
		DEFAULT_BROKERS[0];

	return BrokerConfigSchema.parse({
		id: document.brokerId,
		name: document.name,
		pricingUrl: document.pricingUrl,
		dpCharge: document.dpCharge ?? fallback.dpCharge,
		dpChargeType: document.dpChargeType ?? fallback.dpChargeType,
		dpChargeConfig: parseFeeRule(document.dpChargeConfig, fallback.dpChargeConfig),
		equityDelivery: parseFeeRule(document.equityDelivery, fallback.equityDelivery),
		equityIntraday: parseFeeRule(document.equityIntraday, fallback.equityIntraday),
		futures: parseFeeRule(document.futures, fallback.futures),
		options: parseFeeRule(document.options, fallback.options),
		commodity: parseFeeRule(document.commodity, fallback.commodity),
		currency: parseFeeRule(document.currency, fallback.currency),
		mtf: parseFeeRule(document.mtf, fallback.mtf),
		updatedAt: document.$updatedAt,
	});
}

function getAppwriteErrorCode(error: unknown) {
	return typeof error === "object" && error !== null && "code" in error
		? (error as { code?: unknown }).code
		: undefined;
}

/**
 * Builds a simple diff list between two configs.
 * Only tracks the top-level scalar fields and the dpChargeConfig sub-object.
 */
function buildDiff(prev: BrokerConfig, next: BrokerConfig): AuditLogChange[] {
	const changes: AuditLogChange[] = [];

	const flatFields: (keyof BrokerConfig)[] = [
		"name",
		"pricingUrl",
		"dpCharge",
		"dpChargeType",
	];

	for (const field of flatFields) {
		const from = prev[field];
		const to = next[field];
		if (JSON.stringify(from) !== JSON.stringify(to)) {
			changes.push({ field, from, to });
		}
	}

	// Deep compare dpChargeConfig
	if (JSON.stringify(prev.dpChargeConfig) !== JSON.stringify(next.dpChargeConfig)) {
		changes.push({ field: "dpChargeConfig", from: prev.dpChargeConfig, to: next.dpChargeConfig });
	}

	// Segment rules
	const segments = ["equityDelivery", "equityIntraday", "futures", "options", "commodity", "currency", "mtf"] as const;
	for (const seg of segments) {
		if (JSON.stringify(prev[seg]) !== JSON.stringify(next[seg])) {
			changes.push({ field: seg, from: prev[seg], to: next[seg] });
		}
	}

	return changes;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getBrokerConfigs(): Promise<BrokerConfig[]> {
	if (!appwriteStatus().configured) return DEFAULT_BROKERS;

	const cached = await rGet<BrokerConfig[]>(CK.brokerConfigs);
	if (cached) return cached;

	try {
		const response = await getDatabases().listDocuments(
			getDatabaseId(),
			collectionId,
			[Query.orderAsc("name"), Query.limit(50)],
		);

		if (response.documents.length === 0) {
			return DEFAULT_BROKERS;
		}

		const configs = response.documents.map((doc) =>
			mapBrokerConfig(doc as unknown as BrokerConfigDocument),
		);
		rSet(CK.brokerConfigs, configs, TTL.brokerConfigs).catch(() => {});
		return configs;
	} catch (error) {
		if (getAppwriteErrorCode(error) !== 404) {
			console.error("Failed to fetch broker configs:", error);
		}
		return DEFAULT_BROKERS;
	}
}

export async function getBrokerConfigById(id: string): Promise<BrokerConfig | null> {
	const allConfigs = await getBrokerConfigs();
	return allConfigs.find((c) => c.id === id) ?? null;
}

export async function upsertBrokerConfig(
	config: BrokerConfig,
	source: "admin" | "scraper" = "scraper",
): Promise<void> {
	if (!appwriteStatus().configured) return;

	const data = BrokerConfigSchema.parse(config);
	const payload = {
		brokerId: data.id,
		name: data.name,
		pricingUrl: data.pricingUrl,
		dpCharge: data.dpCharge,
		dpChargeType: data.dpChargeType,
		equityDelivery: JSON.stringify(data.equityDelivery),
		equityIntraday: JSON.stringify(data.equityIntraday),
		futures: JSON.stringify(data.futures),
		options: JSON.stringify(data.options),
		commodity: data.commodity ? JSON.stringify(data.commodity) : undefined,
		currency: data.currency ? JSON.stringify(data.currency) : undefined,
		mtf: data.mtf ? JSON.stringify(data.mtf) : undefined,
		dpChargeConfig: data.dpChargeConfig ? JSON.stringify(data.dpChargeConfig) : undefined,
	};

	try {
		const db = getDatabases();
		const databaseId = getDatabaseId();
		const docs = await db.listDocuments(databaseId, collectionId, [
			Query.equal("brokerId", data.id),
			Query.limit(1),
		]);

		// Compare with existing config to build audit log diff
		let prevConfig: BrokerConfig | null = null;
		if (docs.documents.length > 0) {
			prevConfig = mapBrokerConfig(docs.documents[0] as unknown as BrokerConfigDocument);
		}

		// Persist the updated config
		if (docs.documents.length > 0) {
			await db.updateDocument(databaseId, collectionId, docs.documents[0].$id, payload);
		} else {
			await db.createDocument(databaseId, collectionId, ID.unique(), payload);
		}

		// Write audit log if there were changes
		if (prevConfig) {
			const changes = buildDiff(prevConfig, data);
			if (changes.length > 0) {
				await logBrokerConfigChange({
					brokerId: data.id,
					brokerName: data.name,
					changedAt: new Date().toISOString(),
					source,
					changes: JSON.stringify(changes),
				});
			}
		} else {
			// First-time insert — log initial creation
			await logBrokerConfigChange({
				brokerId: data.id,
				brokerName: data.name,
				changedAt: new Date().toISOString(),
				source,
				changes: JSON.stringify([{ field: "created", from: null, to: data.id }]),
			});
		}

		// Invalidate Redis cache so fresh data is served immediately
		await rDel(CK.brokerConfigs);
	} catch (error) {
		console.warn(
			`Failed to upsert broker config for ${data.id} in Appwrite:`,
			(error as Error).message || error,
		);
		// Do not throw to allow scraper pipeline to succeed gracefully
	}
}

export async function logBrokerConfigChange(entry: Omit<BrokerAuditLog, "$id">): Promise<void> {
	if (!appwriteStatus().configured) return;
	try {
		await getDatabases().createDocument(
			getDatabaseId(),
			auditCollectionId,
			ID.unique(),
			{
				brokerId: entry.brokerId,
				brokerName: entry.brokerName,
				changedAt: entry.changedAt,
				source: entry.source,
				changes: entry.changes,
			},
		);
	} catch (error) {
		console.warn("Failed to write broker audit log:", (error as Error).message || error);
	}
}

export async function getAuditLogsForBroker(brokerId: string, limit = 20): Promise<BrokerAuditLog[]> {
	if (!appwriteStatus().configured) return [];
	try {
		const response = await getDatabases().listDocuments(
			getDatabaseId(),
			auditCollectionId,
			[
				Query.equal("brokerId", brokerId),
				Query.orderDesc("changedAt"),
				Query.limit(limit),
			],
		);
		return response.documents.map((doc) => {
			const d = doc as unknown as AuditLogDocument;
			return {
				$id: d.$id,
				brokerId: d.brokerId,
				brokerName: d.brokerName,
				changedAt: d.changedAt,
				source: d.source,
				changes: d.changes,
			};
		});
	} catch (error) {
		console.error("Failed to fetch audit logs:", error);
		return [];
	}
}
