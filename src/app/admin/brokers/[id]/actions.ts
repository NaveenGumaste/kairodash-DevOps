"use server";

import { auth } from "@/lib/admin-action-auth";
import { upsertBrokerConfig } from "@/features/brokerage/brokerage.repository";
import { BrokerConfig, BrokerConfigSchema } from "@/features/brokerage/brokerage.schemas";
import { revalidatePath } from "next/cache";

export async function updateBrokerConfig(
	config: BrokerConfig,
): Promise<{ success: boolean; changed?: boolean; error?: string }> {
	const { authorized } = await auth();
	if (!authorized) {
		return { success: false, error: "Unauthorized" };
	}

	const parsed = BrokerConfigSchema.safeParse(config);
	if (!parsed.success) {
		return { success: false, error: "Invalid configuration data" };
	}

	try {
		await upsertBrokerConfig(parsed.data, "admin");
		revalidatePath("/admin/brokers");
		revalidatePath(`/admin/brokers/${config.id}`);
		revalidatePath("/tools/brokerage-calculator");
		return { success: true, changed: true };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return { success: false, error: message };
	}
}
