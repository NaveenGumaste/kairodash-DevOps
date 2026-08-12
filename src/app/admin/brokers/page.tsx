import { getBrokerConfigs } from "@/features/brokerage/brokerage.repository";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import RefreshBrokersButton from "./refresh-button";
import { Metadata } from "next";
import Link from "next/link";
import { Pencil, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Broker Configs — Admin",
};

function formatPercent(value: number) {
	if (value === 0) return "₹0 (Free)";
	return `${(value * 100).toFixed(4)}%`;
}

export default async function BrokersAdminPage() {
	const configs = await getBrokerConfigs();

	return (
		<div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Brokers Management</h2>
					<p className="text-muted-foreground mt-1">
						Manage brokerage charge configurations and DP charges. Click Edit to update a broker.
					</p>
				</div>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Supported Brokers ({configs.length})</CardTitle>
						<CardDescription>
							All brokers currently mapped in the system. Use the scraper to auto-refresh DP charges.
						</CardDescription>
					</div>
					<RefreshBrokersButton />
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Broker</TableHead>
									<TableHead>DP Charge (per scrip)</TableHead>
									<TableHead>Equity Delivery</TableHead>
									<TableHead>Equity Intraday</TableHead>
									<TableHead>Options</TableHead>
									<TableHead>Pricing URL</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{configs.map((broker) => {
									const dpTotal = (broker.dpChargeConfig?.brokerFee ?? 0) + (broker.dpChargeConfig?.depositoryFee ?? 0);
									return (
										<TableRow key={broker.id}>
											<TableCell className="font-semibold">{broker.name}</TableCell>
											<TableCell>
												<span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-mono font-medium text-primary ring-1 ring-inset ring-primary/20">
													₹{dpTotal.toFixed(2)} / scrip
												</span>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground font-mono">
												{formatPercent(broker.equityDelivery.percentage)}
												{broker.equityDelivery.maxFlat
													? ` · max ₹${broker.equityDelivery.maxFlat}`
													: ""}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground font-mono">
												{formatPercent(broker.equityIntraday.percentage)}
												{broker.equityIntraday.maxFlat
													? ` · max ₹${broker.equityIntraday.maxFlat}`
													: ""}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground font-mono">
												{formatPercent(broker.options.percentage)}
												{broker.options.maxFlat
													? ` · max ₹${broker.options.maxFlat}`
													: ""}
											</TableCell>
											<TableCell>
												<a
													href={broker.pricingUrl}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground transition-colors"
												>
													Link
													<ExternalLink className="h-3 w-3" />
												</a>
											</TableCell>
											<TableCell className="text-right">
												<Button
													asChild
													variant="outline"
													size="sm"
													className="h-7 gap-1.5 text-xs"
												>
													<Link href={`/admin/brokers/${broker.id}`}>
														<Pencil className="h-3 w-3" />
														Edit
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
