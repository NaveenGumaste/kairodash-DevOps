"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import {
	refreshDashboardAction,
	type DashboardRefreshState,
} from "@/app/actions";
import { toast } from "sonner";


// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────


const initialState: DashboardRefreshState = {
	status: "idle",
	message: "Ready",
	results: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardRefreshButton() {
	const { refresh } = useRouter();
	const formRef = useRef<HTMLFormElement>(null);

	const [state, action, pending] = useActionState(refreshDashboardAction, initialState);

	// ── Revalidate RSC tree on successful refresh ───────────────────────────
	useEffect(() => {
		if (state.status === "success" || state.status === "error") {
			if (state.status === "success") {
				toast.success(state.message);
				refresh();
			} else {
				toast.error(state.message);
			}

			state.results.forEach((result, idx) => {
				setTimeout(() => {
					if (result.status === "success") {
						toast.success(`${result.name}: ${result.message}`);
					} else {
						toast.error(`${result.name}: ${result.message}`);
					}
				}, (idx + 1) * 100);
			});
		}
	}, [refresh, state]);



	return (
		<form
			ref={formRef}
			action={action}
			className="flex flex-col items-start gap-2 sm:items-end"
		>
			{/* ── Primary action button ── */}
			<div className="flex items-center gap-2">

				{/* Refresh button — always rendered so form submit still works */}
				<button
					type="submit"
					disabled={pending}
					className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm hover:shadow disabled:opacity-60 cursor-pointer"
				>
					<RefreshCw
						className={`h-4 w-4 ${pending ? "animate-spin" : ""}`}
						aria-hidden="true"
					/>
					{pending ? "Refreshing…" : "Refresh all data"}
				</button>
			</div>

			{/* Status panel removed in favor of toast notifications */}
		</form>
	);
}
