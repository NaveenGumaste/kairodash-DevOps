"use client";

import { useState, useMemo } from "react";
import {
	BadgeIndianRupee,
	BarChart3,
	BriefcaseBusiness,
	Calculator,
	IndianRupee,
	ReceiptText,
	TrendingUp,
	FileText,
	SplitSquareHorizontal
} from "lucide-react";
import { DEFAULT_BROKERS } from "@/features/brokerage/default-brokers";
import { BrokerConfig } from "@/features/brokerage/brokerage.schemas";
import {
	calculateBrokerage,
	CalculatorInputs,
	CalculatorResult
} from "@/features/brokerage/calculator.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Segment = "delivery" | "intraday" | "futures" | "options" | "commodity" | "currency" | "mtf";

const segmentLabels: Record<Segment, string> = {
	delivery: "Delivery",
	mtf: "MTF",
	intraday: "Intraday",
	futures: "Futures",
	options: "Options",
	commodity: "Commodity",
	currency: "Currency",
};

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-IN", {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: "currency",
		currency: "INR",
	}).format(value);
}

function formatPercent(value: number) {
	return `${(value * 100).toFixed(value === 0 ? 0 : 3)}%`;
}

function ChargeRow({
	label,
	value,
	emphasis,
}: {
	label: string;
	value: number | string;
	emphasis?: "strong" | "danger" | "muted";
}) {
	return (
		<div
			className={[
				"flex items-center justify-between gap-4 py-2 text-sm",
				emphasis === "strong" ? "font-semibold text-foreground" : "",
				emphasis === "danger" ? "font-semibold text-amber-500 dark:text-amber-400" : "",
				emphasis === "muted" ? "text-muted-foreground/70" : "text-muted-foreground",
			].join(" ")}
		>
			<span className="min-w-0">{label}</span>
			<span className="shrink-0 text-right tabular-nums">
				{typeof value === "number" ? formatCurrency(value) : value}
			</span>
		</div>
	);
}

function MetricTile({
	icon: Icon,
	label,
	value,
	tone = "default",
}: {
	icon: typeof IndianRupee;
	label: string;
	value: string;
	tone?: "default" | "profit" | "cost";
}) {
	return (
		<div className="rounded-lg border border-border bg-background/55 p-3">
			<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
				<Icon
					className={[
						"h-4 w-4",
						tone === "profit" ? "text-emerald-500" : "",
						tone === "cost" ? "text-amber-500" : "",
						tone === "default" ? "text-primary" : "",
					].join(" ")}
					aria-hidden="true"
				/>
				{label}
			</div>
			<div className="mt-2 text-lg font-semibold tabular-nums text-foreground">
				{value}
			</div>
		</div>
	);
}

export default function BrokerageCalculatorClient({
	brokerConfigs,
	category,
	isComparing,
	viewMode,
}: {
	brokerConfigs: BrokerConfig[];
	category: "equity" | "fno" | "commodity_currency";
	isComparing: boolean;
	viewMode: "standard" | "contract-note";
}) {
	const brokers = brokerConfigs.length > 0 ? brokerConfigs : DEFAULT_BROKERS;
	const [brokerId, setBrokerId] = useState<string>("zerodha");
	
	const [compareBrokerId, setCompareBrokerId] = useState<string>("groww");
	const [segment, setSegment] = useState<Segment>(
		category === "fno" ? "futures" : category === "commodity_currency" ? "commodity" : "delivery"
	);
	const [inputs, setInputs] = useState<Omit<CalculatorInputs, "segment">>({
		buyPrice: 1000,
		sellPrice: 1100,
		quantity: 100,
		exchange: "NSE",
	});

	const selectedBroker = useMemo(() => {
		return brokers.find((broker) => broker.id === brokerId) ?? brokers[0];
	}, [brokerId, brokers]);

	const compareBroker = useMemo(() => {
		return brokers.find((broker) => broker.id === compareBrokerId) ?? brokers[1];
	}, [compareBrokerId, brokers]);

	const results = useMemo(() => {
		return calculateBrokerage({ ...inputs, segment }, selectedBroker);
	}, [inputs, segment, selectedBroker]);

	const compareResults = useMemo(() => {
		return calculateBrokerage({ ...inputs, segment }, compareBroker);
	}, [inputs, segment, compareBroker]);

	const grossMargin =
		inputs.buyPrice > 0
			? ((inputs.sellPrice - inputs.buyPrice) / inputs.buyPrice) * 100
			: 0;
	const chargeDrag =
		results.grossPnL !== 0
			? (results.totalTaxesAndCharges / Math.abs(results.grossPnL)) * 100
			: 0;
	
	const activeRule =
		segment === "delivery"
			? selectedBroker.equityDelivery
			: segment === "intraday"
				? selectedBroker.equityIntraday
				: segment === "futures"
					? selectedBroker.futures
					: segment === "commodity"
						? selectedBroker.commodity
						: segment === "currency"
							? selectedBroker.currency
							: segment === "mtf"
								? selectedBroker.mtf
								: selectedBroker.options;

	const handleInputChange = (
		field: keyof typeof inputs,
		value: string | number,
	) => {
		setInputs((prev) => ({ ...prev, [field]: value }));
	};

	const renderChargeSummary = (res: CalculatorResult, brokerName: string, isContractNote: boolean) => {
		if (isContractNote) {
			return (
				<div className="rounded-lg border border-border bg-[#FDFBF7] dark:bg-[#1A1A1A] p-6 shadow-sm font-mono text-sm">
					<div className="mb-6 flex justify-between border-b border-border/50 pb-4">
						<div>
							<h3 className="font-bold text-foreground text-lg uppercase tracking-wider">{brokerName}</h3>
							<p className="text-muted-foreground text-xs mt-1">Tax Invoice / Contract Note</p>
						</div>
						<div className="text-right">
							<p className="font-semibold text-foreground uppercase">{segmentLabels[segment]}</p>
							<p className="text-muted-foreground text-xs">{inputs.exchange}</p>
						</div>
					</div>
					
					<div className="space-y-1 pb-4">
						<div className="flex justify-between text-muted-foreground">
							<span>Gross Trade Value (Turnover)</span>
							<span className="text-foreground">{formatCurrency(res.turnover)}</span>
						</div>
						<div className="flex justify-between text-muted-foreground">
							<span>Gross P&L</span>
							<span className={res.grossPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
								{formatCurrency(res.grossPnL)}
							</span>
						</div>
					</div>

					<div className="border-t border-dashed border-border/50 py-4 space-y-2">
						<p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Levies & Charges</p>
						<ChargeRow label="Brokerage" value={res.brokerage} />
						<ChargeRow label="Exchange Transaction Charges" value={res.exchangeTxnCharge} />
						<ChargeRow label="SEBI Turnover Fees" value={res.sebiCharges} />
						{res.ipftCharge > 0 && <ChargeRow label="IPFT Charges" value={res.ipftCharge} />}
						<ChargeRow label="Securities Transaction Tax (STT)" value={res.stt} />
						<ChargeRow label="Stamp Duty" value={res.stampDuty} />
						{(segment === "delivery" || segment === "mtf") && res.dpChargeTotal > 0 && (
							<ChargeRow label="Depository (DP) Charges" value={res.dpChargeTotal} />
						)}
						<ChargeRow label="GST @ 18%" value={res.gst} />
					</div>

					<div className="border-t border-border/50 pt-4 mt-2">
						<div className="flex items-start justify-between gap-4 font-bold text-base">
							<span className="min-w-0 text-foreground">Total Taxes & Charges</span>
							<span className="shrink-0 text-red-600 dark:text-red-400">{formatCurrency(res.totalTaxesAndCharges)}</span>
						</div>
						<div className="flex items-start justify-between gap-4 font-bold text-lg mt-4 bg-muted/30 p-3 rounded-md">
							<span className="min-w-0 text-foreground">Net Amount Receivable/Payable</span>
							<span className={["shrink-0 pt-0.5", res.netPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"].join(" ")}>
								{formatCurrency(res.netPnL)}
							</span>
						</div>
					</div>
				</div>
			);
		}

		return (
			<>
				<div className="rounded-lg bg-background/60 p-4 border border-border/50">
					<div className="flex justify-between items-center">
						<div className="text-xs font-medium uppercase text-muted-foreground">
							Net P&L ({brokerName})
						</div>
						<span className={[
							"rounded-md px-2 py-1 text-xs font-bold",
							res.netPnL >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
						].join(" ")}>
							{res.netPnL >= 0 ? "PROFIT" : "LOSS"}
						</span>
					</div>
					<div
						className={[
							"mt-2 text-3xl font-bold tracking-tight tabular-nums",
							res.netPnL >= 0 ? "text-emerald-500" : "text-red-500",
						].join(" ")}
					>
						{formatCurrency(res.netPnL)}
					</div>
					<div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-3 py-2 rounded-md">
						<TrendingUp className="h-4 w-4" />
						Breakeven move: {res.breakevenPoint.toFixed(2)} points
					</div>
				</div>

				<div className="mt-4 divide-y divide-border/70">
					<ChargeRow label="Turnover" value={res.turnover} />
					<ChargeRow label="Brokerage" value={res.brokerage} />
					<ChargeRow label="STT / CTT" value={res.stt} />
					<ChargeRow label="Exchange Txn Charge" value={res.exchangeTxnCharge} />
					<ChargeRow label="SEBI Charges" value={res.sebiCharges} />
					<ChargeRow label="IPFT Charges" value={res.ipftCharge} />
					<ChargeRow label="Stamp Duty" value={res.stampDuty} />
					{(segment === "delivery" || segment === "mtf") && (
						<ChargeRow
							label="DP Charge"
							value={res.dpChargeTotal}
							emphasis="danger"
						/>
					)}
					<ChargeRow label="GST (18%)" value={res.gst} />
					<ChargeRow
						label="Total Tax & Charges"
						value={res.totalTaxesAndCharges}
						emphasis="strong"
					/>
				</div>
			</>
		);
	};

	return (
		<div className="space-y-4">
			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
				<div className="space-y-5">
					<div className="grid gap-4 md:grid-cols-3">
						<MetricTile
							icon={TrendingUp}
							label="Gross P&L"
							value={formatCurrency(results.grossPnL)}
							tone={results.grossPnL >= 0 ? "profit" : "cost"}
						/>
						<MetricTile
							icon={ReceiptText}
							label={`Total Charges (${selectedBroker.name})`}
							value={formatCurrency(results.totalTaxesAndCharges)}
							tone="cost"
						/>
						<MetricTile
							icon={BarChart3}
							label={`Net P&L (${selectedBroker.name})`}
							value={formatCurrency(results.netPnL)}
							tone={results.netPnL >= 0 ? "profit" : "cost"}
						/>
					</div>

					<Card className="rounded-lg shadow-sm border-border/80">
						<CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
							<CardTitle className="flex items-center gap-2 text-lg">
								<Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
								Trade Setup
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6 pt-6">
							<div className="grid gap-4 lg:grid-cols-2">
								<div className="space-y-2">
									<Label className="text-muted-foreground font-semibold">Primary Broker</Label>
									<Select value={brokerId} onValueChange={setBrokerId}>
										<SelectTrigger className="h-11 w-full rounded-lg bg-background font-medium text-foreground">
											<SelectValue placeholder="Select broker" />
										</SelectTrigger>
										<SelectContent>
											{brokers.map((broker) => (
												<SelectItem key={broker.id} value={broker.id}>
													{broker.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{isComparing ? (
									<div className="space-y-2">
										<Label className="text-muted-foreground font-semibold">Compare With</Label>
										<Select value={compareBrokerId} onValueChange={setCompareBrokerId}>
											<SelectTrigger className="h-11 w-full rounded-lg bg-primary/5 border-primary/20 font-medium text-primary">
												<SelectValue placeholder="Compare broker" />
											</SelectTrigger>
											<SelectContent>
												{brokers.map((broker) => (
													<SelectItem key={broker.id} value={broker.id}>
														{broker.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								) : (
									<div className="space-y-2">
										<Label className="text-muted-foreground font-semibold">Exchange</Label>
										<Select
											value={inputs.exchange}
											onValueChange={(value) => handleInputChange("exchange", value)}
										>
											<SelectTrigger className="h-11 w-full rounded-lg bg-background font-medium text-foreground">
												<SelectValue placeholder="Select exchange" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="NSE">NSE</SelectItem>
												<SelectItem value="BSE">BSE</SelectItem>
												<SelectItem value="MCX">MCX</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</div>

							<div className="space-y-4">
								<div className="space-y-3">
									<Label className="text-muted-foreground font-semibold">Segment</Label>
									<Tabs
										value={segment}
										onValueChange={(value) => setSegment(value as Segment)}
									>
										<TabsList className="grid h-auto w-full gap-1 rounded-lg bg-muted/30 p-1" style={{ gridTemplateColumns: `repeat(${category === "equity" ? 3 : 2}, minmax(0, 1fr))` }}>
											{category === "equity" && (
												<>
													<TabsTrigger value="delivery" className="h-9 rounded-md text-xs font-medium">Delivery</TabsTrigger>
													<TabsTrigger value="intraday" className="h-9 rounded-md text-xs font-medium">Intraday</TabsTrigger>
													<TabsTrigger value="mtf" className="h-9 rounded-md text-xs font-medium">MTF</TabsTrigger>
												</>
											)}
											{category === "fno" && (
												<>
													<TabsTrigger value="futures" className="h-9 rounded-md text-xs font-medium">Futures</TabsTrigger>
													<TabsTrigger value="options" className="h-9 rounded-md text-xs font-medium">Options</TabsTrigger>
												</>
											)}
											{category === "commodity_currency" && (
												<>
													<TabsTrigger value="commodity" className="h-9 rounded-md text-xs font-medium">Commodity</TabsTrigger>
													<TabsTrigger value="currency" className="h-9 rounded-md text-xs font-medium">Currency</TabsTrigger>
												</>
											)}
										</TabsList>
									</Tabs>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-3 pt-2">
								<div className="space-y-2">
									<Label htmlFor="buyPrice" className="text-muted-foreground font-semibold">Buy Price</Label>
									<div className="relative">
										<IndianRupee
											className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
											aria-hidden="true"
										/>
										<Input
											id="buyPrice"
											type="number"
											value={inputs.buyPrice}
											onChange={(event) =>
												handleInputChange("buyPrice", Number(event.target.value))
											}
											className="h-11 rounded-lg bg-background pl-9 tabular-nums font-medium"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="sellPrice" className="text-muted-foreground font-semibold">Sell Price</Label>
									<div className="relative">
										<IndianRupee
											className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
											aria-hidden="true"
										/>
										<Input
											id="sellPrice"
											type="number"
											value={inputs.sellPrice}
											onChange={(event) =>
												handleInputChange("sellPrice", Number(event.target.value))
											}
											className="h-11 rounded-lg bg-background pl-9 tabular-nums font-medium"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="quantity" className="text-muted-foreground font-semibold">Quantity</Label>
									<Input
										id="quantity"
										type="number"
										value={inputs.quantity}
										onChange={(event) =>
											handleInputChange("quantity", Number(event.target.value))
										}
										className="h-11 rounded-lg bg-background tabular-nums font-medium"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid gap-4 lg:grid-cols-3">
						<div className="rounded-lg border border-border bg-card p-4">
							<div className="flex items-center gap-2 text-sm font-bold">
								<BriefcaseBusiness
									className="h-4 w-4 text-primary"
									aria-hidden="true"
								/>
								{selectedBroker.name} Rate
							</div>
							<div className="mt-3 space-y-2 text-sm text-muted-foreground">
								<div className="flex justify-between gap-3 border-b border-border/50 pb-2">
									<span>Segment</span>
									<span className="font-semibold text-foreground">
										{segmentLabels[segment]}
									</span>
								</div>
								<div className="flex justify-between gap-3 pt-1">
									<span>Brokerage Rate</span>
									<span className="font-semibold text-foreground">
										{formatPercent(activeRule?.percentage ?? 0)}
									</span>
								</div>
							</div>
						</div>
						<div className="rounded-lg border border-border bg-card p-4">
							<div className="flex items-center gap-2 text-sm font-bold">
								<BadgeIndianRupee
									className="h-4 w-4 text-amber-500"
									aria-hidden="true"
								/>
								DP Charge (Per Scrip)
							</div>
							<div className="mt-3 text-2xl font-bold tabular-nums text-foreground">
								{formatCurrency((selectedBroker.dpChargeConfig?.brokerFee ?? 0) + (selectedBroker.dpChargeConfig?.depositoryFee ?? 0))}
							</div>
							<div className="mt-1 text-xs text-muted-foreground font-medium">
								+ 18% GST Applicable
							</div>
						</div>
						<div className="rounded-lg border border-border bg-card p-4">
							<div className="flex items-center gap-2 text-sm font-bold">
								<BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
								Trade Spread
							</div>
							<div className="mt-3 text-2xl font-bold tabular-nums text-foreground">
								{grossMargin.toFixed(2)}%
							</div>
							<div className="mt-1 text-xs text-muted-foreground font-medium">
								Charges use {chargeDrag.toFixed(1)}% of gross movement
							</div>
						</div>
					</div>
				</div>

				<div className={`grid gap-4 ${isComparing ? 'xl:w-[700px] xl:grid-cols-2' : 'xl:w-[380px]'}`}>
					<Card className="rounded-lg border-primary/20 bg-card shadow-sm h-fit sticky top-4">
						<CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
							<CardTitle className="text-base flex items-center justify-between">
								<span>{isComparing ? selectedBroker.name : "Charge Summary"}</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4 pb-6">
							{renderChargeSummary(results, selectedBroker.name, viewMode === "contract-note")}
						</CardContent>
					</Card>

					{isComparing && (
						<Card className="rounded-lg border-amber-500/30 bg-card shadow-sm h-fit sticky top-4">
							<CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
								<CardTitle className="text-base flex items-center justify-between text-amber-600 dark:text-amber-400">
									<span>{compareBroker.name}</span>
									<span className="text-xs px-2 py-1 bg-amber-500/10 rounded-md font-bold">Comparison</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-4 pb-6">
								{renderChargeSummary(compareResults, compareBroker.name, viewMode === "contract-note")}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
