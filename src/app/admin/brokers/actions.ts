"use server";

import { revalidatePath } from "next/cache";
import { refreshAllBrokerConfigs } from "@/features/brokerage/brokerage.service";
import { auth } from "@/lib/admin-action-auth";

export async function refreshBrokersDataAction() {
	const session = await auth();
	if (!session.authorized) {
		throw new Error("Unauthorized admin action.");
	}

	try {
		const results = await refreshAllBrokerConfigs();
		revalidatePath("/admin/brokers");
		revalidatePath("/tools/brokerage-calculator");
		return { success: true, results };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to refresh brokers",
		};
	}
}
