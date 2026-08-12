"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatCurrency(val: number) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(val);
}

export default function FdCalculator() {
	const [principal, setPrincipal] = useState(100000);
	const [interestRate, setInterestRate] = useState(7);
	const [timePeriod, setTimePeriod] = useState(5);
	const [compoundingFreq, setCompoundingFreq] = useState<"12" | "4" | "2" | "1">("4");

	const { investedAmount, estReturns, totalValue } = useMemo(() => {
		const p = principal;
		const r = interestRate / 100;
		const t = timePeriod;
		const n = parseInt(compoundingFreq, 10);

		// Formula: A = P(1 + r/n)^(nt)
		let a = p;
		if (r > 0) {
			a = p * Math.pow(1 + r / n, n * t);
		}

		return {
			investedAmount: p,
			estReturns: a - p,
			totalValue: a,
		};
	}, [principal, interestRate, timePeriod, compoundingFreq]);

	const data = [
		{ name: "Principal Amount", value: investedAmount },
		{ name: "Total Interest", value: estReturns },
	];

	const COLORS = ["#3b82f6", "#f59e0b"]; // Blue for principal, Amber for interest

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_400px]">
			<div className="space-y-6">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Fixed Deposit Calculator</CardTitle>
						<CardDescription>Calculate maturity value and interest earned on your fixed deposits from any bank.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-8">
						<div className="space-y-4">
							<div className="flex justify-between items-end">
								<Label className="text-sm font-medium">Total Investment (₹)</Label>
								<div className="relative w-32">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
									<Input 
										type="number" 
										className="pl-7 h-9 font-mono text-sm" 
										value={principal} 
										onChange={(e) => setPrincipal(Number(e.target.value))} 
									/>
								</div>
							</div>
							<input
								type="range"
								min="10000"
								max="10000000"
								step="10000"
								value={principal}
								onChange={(e) => setPrincipal(Number(e.target.value))}
								className="w-full accent-primary"
							/>
						</div>

						<div className="space-y-4">
							<div className="flex justify-between items-end">
								<Label className="text-sm font-medium">Interest Rate (p.a)</Label>
								<div className="relative w-24">
									<Input 
										type="number" 
										className="pr-7 h-9 font-mono text-sm" 
										value={interestRate} 
										onChange={(e) => setInterestRate(Number(e.target.value))} 
									/>
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
								</div>
							</div>
							<input
								type="range"
								min="1"
								max="15"
								step="0.1"
								value={interestRate}
								onChange={(e) => setInterestRate(Number(e.target.value))}
								className="w-full accent-primary"
							/>
						</div>

						<div className="space-y-4">
							<div className="flex justify-between items-end">
								<Label className="text-sm font-medium">Time Period (Years)</Label>
								<div className="relative w-24">
									<Input 
										type="number" 
										className="pr-8 h-9 font-mono text-sm" 
										value={timePeriod} 
										onChange={(e) => setTimePeriod(Number(e.target.value))} 
									/>
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Yr</span>
								</div>
							</div>
							<input
								type="range"
								min="1"
								max="30"
								step="1"
								value={timePeriod}
								onChange={(e) => setTimePeriod(Number(e.target.value))}
								className="w-full accent-primary"
							/>
						</div>

						<div className="space-y-4">
							<Label className="text-sm font-medium">Compounding Frequency</Label>
							<Select value={compoundingFreq} onValueChange={(val: any) => setCompoundingFreq(val)}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select frequency" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="12">Monthly</SelectItem>
									<SelectItem value="4">Quarterly (Standard)</SelectItem>
									<SelectItem value="2">Half-Yearly</SelectItem>
									<SelectItem value="1">Yearly</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="space-y-6">
				<Card className="border-border/60 bg-card/50 backdrop-blur-sm h-full">
					<CardContent className="p-6 flex flex-col h-full">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Maturity Value</p>
							<p className="text-4xl font-bold tracking-tight text-foreground">{formatCurrency(totalValue)}</p>
						</div>

						<div className="mt-8 flex-1 min-h-[200px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={data}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={80}
										paddingAngle={5}
										dataKey="value"
										stroke="none"
									>
										{data.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip 
										formatter={(value: any) => formatCurrency(Number(value))}
										contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--background)' }}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>

						<div className="space-y-4 mt-6">
							<div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border border-border/50">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
									<span className="text-sm font-medium text-muted-foreground">Principal Amount</span>
								</div>
								<span className="font-mono text-sm font-medium">{formatCurrency(investedAmount)}</span>
							</div>
							<div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border border-border/50">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
									<span className="text-sm font-medium text-muted-foreground">Total Interest</span>
								</div>
								<span className="font-mono text-sm font-medium text-amber-500">{formatCurrency(estReturns)}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
