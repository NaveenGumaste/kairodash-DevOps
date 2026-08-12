"use server";

import { revalidatePath } from "next/cache";
import { refreshAllBrokerConfigs } from "@/features/brokerage/brokerage.service";
import { runFilingsJob } from "@/features/filings/filings.service";
import { runGeopoliticsJob } from "@/features/geopolitics/geopolitics.service";
import { runIndianMarketIngestion } from "@/features/indianMarket/indianMarket.service";
import { runMarketBriefJob } from "@/features/marketBrief/marketBrief.service";
import { invalidateAllCaches } from "@/lib/cache-invalidation";


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardRefreshStatus =
	| "idle"
	| "success"
	| "error";

export type DashboardRefreshState = {
	status: DashboardRefreshStatus;
	message: string;
	results: {
		name: string;
		status: "success" | "error";
		message: string;
	}[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function settle(name: string, job: () => Promise<unknown>) {
	try {
		const result = await job();
		return {
			name,
			status: "success" as const,
			message: summarizeResult(result),
		};
	} catch (error) {
		return {
			name,
			status: "error" as const,
			message: error instanceof Error ? error.message : "Failed",
		};
	}
}

function summarizeResult(result: unknown) {
	if (!result || typeof result !== "object") return "Completed";
	const value = result as Record<string, unknown>;

	if ("processed" in value) {
		const processed = value.processed as unknown[];
		return `Processed ${Array.isArray(processed) ? processed.length : 0} alerts`;
	}

	if ("created" in value) {
		const created = value.created as unknown;
		return `Created ${Array.isArray(created) ? created.length : created ? 1 : 0} records`;
	}

	if ("posted" in value || "failures" in value) {
		return `Fetched ${(value.posted as unknown[])?.length ?? 0} filing items; ${(value.failures as unknown[])?.length ?? 0} failures`;
	}

	if (Array.isArray(result) && result.some((item) => "brokerId" in item)) {
		const successes = result.filter((item) => item.status === "success").length;
		const changed = result.filter((item) => item.changed).length;
		return `Refreshed ${successes} brokers; ${changed} DP charge${changed === 1 ? "" : "s"} changed`;
	}

	return "Completed";
}



// ─────────────────────────────────────────────────────────────────────────────
// Main Action
// ─────────────────────────────────────────────────────────────────────────────

const REVALIDATE_PATHS = [
	"/",
	"/stocks",
	"/alerts/indian-market",
	"/alerts/geopolitics",
	"/briefs/morning",
	"/admin/jobs",
	"/admin/watchlist",
	"/admin/brokers",
	"/tools/brokerage-calculator",
] as const;

export async function refreshDashboardAction(
	_prevState?: DashboardRefreshState,
	_formData?: FormData,
): Promise<DashboardRefreshState> {
	void _prevState;
	void _formData;



	// ── Step 2: run all data jobs in parallel ──────────────────────────────────
	console.log("[actions:refresh] Running all jobs.");
	const results = await Promise.all([
		settle("Indian market alerts", runIndianMarketIngestion),
		settle("Geopolitical alerts", runGeopoliticsJob),
		settle("Morning brief", runMarketBriefJob),
		settle("Filings", runFilingsJob),
		settle("Broker DP charges", refreshAllBrokerConfigs),
	]);

	// ── Step 3: revalidate all cached paths ───────────────────────────────────
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	await invalidateAllCaches();

	const failures = results.filter((r) => r.status === "error");

	console.log(
		"[actions:refresh] Refresh complete — %d/%d jobs succeeded.",
		results.length - failures.length,
		results.length,
	);

	return {
		status: failures.length === results.length ? "error" : "success",
		message: failures.length
			? `Refresh completed with ${failures.length} failed task${failures.length === 1 ? "" : "s"}.`
			: "Refresh completed successfully.",
		results,
	};
}
