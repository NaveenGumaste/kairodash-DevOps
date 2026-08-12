import "server-only";

import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function auth() {
	const expected = env.ADMIN_ACTION_TOKEN;

	if (!expected) {
		return { authorized: true };
	}

	const cookieStore = await cookies();
	const actual = cookieStore.get("admin_action_token")?.value;

	if (actual !== expected) {
		return { authorized: false };
	}

	return { authorized: true };
}
