"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { refreshBrokersDataAction } from "./actions";

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Refresh failed";
}

export default function RefreshBrokersButton() {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const handleRefresh = async () => {
		setLoading(true);
		setMessage("");
		try {
			const res = await refreshBrokersDataAction();
			if (res.success) {
				setMessage("Successfully refreshed data from broker websites.");
			} else {
				setMessage(`Error: ${res.error}`);
			}
		} catch (error) {
			setMessage(`Exception: ${getErrorMessage(error)}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center gap-4">
			<button
				type="button"
				disabled={loading}
				onClick={handleRefresh}
				className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
			>
				{loading ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<RefreshCw className="mr-2 h-4 w-4" />
				)}
				Scrape & Refresh DP Charges
			</button>
			{message && <span className="text-sm font-medium">{message}</span>}
		</div>
	);
}
