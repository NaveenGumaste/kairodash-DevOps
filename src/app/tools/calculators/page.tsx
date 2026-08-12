import { Metadata } from "next";
import { getBrokerConfigs } from "@/features/brokerage/brokerage.repository";
import CalculatorsClient from "./calculators-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Calculators - kairo",
	description: "Financial calculators including Brokerage, SIP, and Fixed Deposits.",
};

export default async function CalculatorsPage() {
	const brokerConfigs = await getBrokerConfigs();

	return (
		<div className="flex-1 space-y-4">
			<div className="flex flex-col gap-2">
				<h2 className="text-2xl font-bold tracking-tight md:text-3xl">
					Calculators
				</h2>
				<p className="max-w-3xl text-sm text-muted-foreground">
					Evaluate trade profitability, model systematic investments, and forecast fixed deposit returns.
				</p>
			</div>
			<div>
				<CalculatorsClient brokerConfigs={brokerConfigs} />
			</div>
		</div>
	);
}
