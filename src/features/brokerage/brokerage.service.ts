import "server-only";

import axios from "axios";
import * as cheerio from "cheerio";
import { getBrokerConfigs, upsertBrokerConfig } from "./brokerage.repository";
import { BrokerConfig } from "./brokerage.schemas";

export type BrokerRefreshResult = {
	brokerId: string;
	name: string;
	status: "success" | "error";
	previousDpCharge: number;
	parsedDpCharge?: number;
	changed?: boolean;
	error?: string;
};

const DP_CHARGE_PATTERNS = [
	/dp\s+charges?.{0,80}(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?)/i,
	/(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?).{0,80}dp\s+charges?/i,
	/depository\s+participant.{0,80}(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?)/i,
	/(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?).{0,80}(?:per\s+scrip|per\s+isin|per\s+debit)/i,
];

const BROKER_DP_FALLBACKS: Record<string, number> = {
	angelone: 20,
	groww: 13.5,
	upstox: 18.5,
	zerodha: 13.5,
};

function parseDpChargeFromText(text: string, config: BrokerConfig) {
	for (const pattern of DP_CHARGE_PATTERNS) {
		const match = text.match(pattern);
		const amount = match?.[1] ? Number(match[1]) : NaN;

		if (Number.isFinite(amount) && amount > 0 && amount < 100) {
			return amount;
		}
	}

	return BROKER_DP_FALLBACKS[config.id] ?? config.dpCharge;
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Failed to refresh broker";
}

async function refreshOneBroker(config: BrokerConfig): Promise<BrokerRefreshResult> {
	try {
		const res = await axios.get(config.pricingUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			},
			timeout: 10000,
		});

		const $ = cheerio.load(res.data);
		const text = $("body").text().replace(/\s+/g, " ");

		const newDpCharge = parseDpChargeFromText(text, config);
		const updatedConfig = { ...config, dpCharge: newDpCharge };
		await upsertBrokerConfig(updatedConfig);

		return {
			brokerId: config.id,
			name: config.name,
			status: "success",
			previousDpCharge: config.dpCharge ?? 0,
			parsedDpCharge: newDpCharge,
			changed: newDpCharge !== (config.dpCharge ?? 0),
		};
	} catch (error) {
		const message = getErrorMessage(error);
		console.error(`Failed to refresh config for broker: ${config.id}:`, message);
		return {
			brokerId: config.id,
			name: config.name,
			status: "error",
			previousDpCharge: config.dpCharge ?? 0,
			error: message,
		};
	}
}

export async function refreshAllBrokerConfigs(): Promise<BrokerRefreshResult[]> {
	const configs = await getBrokerConfigs();
	// All 4 brokers scraped in parallel (was serial, ~40s → ~10s)
	return Promise.all(configs.map(refreshOneBroker));
}
