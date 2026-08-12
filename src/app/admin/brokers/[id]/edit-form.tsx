"use client";

import { useState, useTransition } from "react";
import { BrokerConfig } from "@/features/brokerage/brokerage.schemas";
import { updateBrokerConfig } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface FeeRowProps {
	label: string;
	percentageKey: string;
	maxFlatKey: string;
	percentageValue: number;
	maxFlatValue: number | undefined;
	onChange: (key: string, value: number) => void;
}

function FeeRow({ label, percentageKey, maxFlatKey, percentageValue, maxFlatValue, onChange }: FeeRowProps) {
	return (
		<div className="grid grid-cols-[1fr_auto_auto] items-end gap-3">
			<div className="space-y-1.5">
				<Label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
					{label}
				</Label>
				<div className="relative">
					<Input
						type="number"
						step="0.000001"
						value={percentageValue}
						onChange={(e) => onChange(percentageKey, Number(e.target.value))}
						className="h-9 text-sm font-mono pr-10"
						placeholder="0.0003"
					/>
					<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
				</div>
			</div>
			<div className="space-y-1.5 w-28">
				<Label className="text-xs text-muted-foreground font-medium">Max Flat (₹)</Label>
				<Input
					type="number"
					value={maxFlatValue ?? 0}
					onChange={(e) => onChange(maxFlatKey, Number(e.target.value))}
					className="h-9 text-sm font-mono"
					placeholder="20"
				/>
			</div>
		</div>
	);
}

type FormState = {
	name: string;
	pricingUrl: string;
	dpBrokerFee: number;
	dpDepositoryFee: number;
	equityDelivery_percentage: number;
	equityDelivery_maxFlat: number;
	equityIntraday_percentage: number;
	equityIntraday_maxFlat: number;
	futures_percentage: number;
	futures_maxFlat: number;
	options_percentage: number;
	options_maxFlat: number;
	commodity_percentage: number;
	commodity_maxFlat: number;
	currency_percentage: number;
	currency_maxFlat: number;
	mtf_percentage: number;
	mtf_maxFlat: number;
};

function brokerToFormState(broker: BrokerConfig): FormState {
	return {
		name: broker.name,
		pricingUrl: broker.pricingUrl,
		dpBrokerFee: broker.dpChargeConfig?.brokerFee ?? 0,
		dpDepositoryFee: broker.dpChargeConfig?.depositoryFee ?? 0,
		equityDelivery_percentage: broker.equityDelivery.percentage,
		equityDelivery_maxFlat: broker.equityDelivery.maxFlat ?? 0,
		equityIntraday_percentage: broker.equityIntraday.percentage,
		equityIntraday_maxFlat: broker.equityIntraday.maxFlat ?? 0,
		futures_percentage: broker.futures.percentage,
		futures_maxFlat: broker.futures.maxFlat ?? 0,
		options_percentage: broker.options.percentage,
		options_maxFlat: broker.options.maxFlat ?? 0,
		commodity_percentage: broker.commodity?.percentage ?? 0,
		commodity_maxFlat: broker.commodity?.maxFlat ?? 0,
		currency_percentage: broker.currency?.percentage ?? 0,
		currency_maxFlat: broker.currency?.maxFlat ?? 0,
		mtf_percentage: broker.mtf?.percentage ?? 0,
		mtf_maxFlat: broker.mtf?.maxFlat ?? 0,
	};
}

export default function BrokerEditForm({ broker }: { broker: BrokerConfig }) {
	const [form, setForm] = useState<FormState>(() => brokerToFormState(broker));
	const [isPending, startTransition] = useTransition();

	function handleChange(key: string, value: number | string) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const updated: BrokerConfig = {
			...broker,
			name: form.name,
			pricingUrl: form.pricingUrl,
			dpChargeConfig: broker.dpChargeConfig
				? {
					...broker.dpChargeConfig,
					brokerFee: form.dpBrokerFee,
					depositoryFee: form.dpDepositoryFee,
				}
				: undefined,
			equityDelivery: { percentage: form.equityDelivery_percentage, maxFlat: form.equityDelivery_maxFlat },
			equityIntraday: { percentage: form.equityIntraday_percentage, maxFlat: form.equityIntraday_maxFlat },
			futures: { percentage: form.futures_percentage, maxFlat: form.futures_maxFlat },
			options: { percentage: form.options_percentage, maxFlat: form.options_maxFlat },
			commodity: { percentage: form.commodity_percentage, maxFlat: form.commodity_maxFlat },
			currency: { percentage: form.currency_percentage, maxFlat: form.currency_maxFlat },
			mtf: { percentage: form.mtf_percentage, maxFlat: form.mtf_maxFlat },
		};

		startTransition(async () => {
			const result = await updateBrokerConfig(updated);
			if (result.success) {
				toast.success("Broker config saved", {
					description: result.changed
						? "Changes detected and logged to audit trail."
						: "No changes detected — config is already up to date.",
				});
			} else {
				toast.error("Failed to save", { description: result.error });
			}
		});
	}

	const segments: Array<{
		label: string;
		key: "equityDelivery" | "equityIntraday" | "futures" | "options" | "commodity" | "currency" | "mtf";
	}> = [
		{ label: "Equity Delivery", key: "equityDelivery" },
		{ label: "Equity Intraday", key: "equityIntraday" },
		{ label: "MTF", key: "mtf" },
		{ label: "Futures", key: "futures" },
		{ label: "Options", key: "options" },
		{ label: "Commodity", key: "commodity" },
		{ label: "Currency", key: "currency" },
	];

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Basic Info */}
			<Card className="border-border/60">
				<CardHeader className="pb-4">
					<CardTitle className="text-base">Basic Information</CardTitle>
					<CardDescription>Name and pricing reference URL for this broker.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="name">Broker Name</Label>
							<Input
								id="name"
								value={form.name}
								onChange={(e) => handleChange("name", e.target.value)}
								className="h-9"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="pricingUrl">Pricing URL</Label>
							<Input
								id="pricingUrl"
								type="url"
								value={form.pricingUrl}
								onChange={(e) => handleChange("pricingUrl", e.target.value)}
								className="h-9 font-mono text-sm"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* DP Charges */}
			<Card className="border-border/60">
				<CardHeader className="pb-4">
					<CardTitle className="text-base">DP Charges (Per ISIN / Scrip)</CardTitle>
					<CardDescription>
						Depository Participant charge applied on sell for Delivery and MTF segments. GST (18%) is added on top.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="dpBrokerFee">Broker Fee (₹)</Label>
							<Input
								id="dpBrokerFee"
								type="number"
								step="0.01"
								value={form.dpBrokerFee}
								onChange={(e) => handleChange("dpBrokerFee", Number(e.target.value))}
								className="h-9 font-mono"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="dpDepositoryFee">Depository Fee (₹)</Label>
							<Input
								id="dpDepositoryFee"
								type="number"
								step="0.01"
								value={form.dpDepositoryFee}
								onChange={(e) => handleChange("dpDepositoryFee", Number(e.target.value))}
								className="h-9 font-mono"
							/>
						</div>
					</div>
					<p className="text-xs text-muted-foreground">
						Total per scrip: ₹{(form.dpBrokerFee + form.dpDepositoryFee).toFixed(2)} + 18% GST
					</p>
				</CardContent>
			</Card>

			{/* Segment Brokerage */}
			<Card className="border-border/60">
				<CardHeader className="pb-4">
					<CardTitle className="text-base">Segment Brokerage Rates</CardTitle>
					<CardDescription>
						Percentage of trade value. Max flat cap of ₹0 means no cap. Enter percentage as decimal (e.g. 0.0003 = 0.03%).
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{segments.map((seg, idx) => (
						<div key={seg.key}>
							{idx > 0 && <Separator className="my-4" />}
							<FeeRow
								label={seg.label}
								percentageKey={`${seg.key}_percentage`}
								maxFlatKey={`${seg.key}_maxFlat`}
								percentageValue={(form as unknown as Record<string, number>)[`${seg.key}_percentage`]}
								maxFlatValue={(form as unknown as Record<string, number>)[`${seg.key}_maxFlat`]}
								onChange={handleChange}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button type="submit" disabled={isPending} className="min-w-32 gap-2">
					{isPending ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Saving…
						</>
					) : (
						<>
							<Save className="h-4 w-4" />
							Save Changes
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
