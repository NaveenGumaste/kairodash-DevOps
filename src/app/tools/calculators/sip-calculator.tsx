"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function formatCurrency(val: number) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(val);
}

export default function SipCalculator() {
	const [monthlyInvestment, setMonthlyInvestment] = useState(25000);
	const [expectedReturn, setExpectedReturn] = useState(12);
	const [timePeriod, setTimePeriod] = useState(10);

	const { investedAmount, estReturns, totalValue } = useMemo(() => {
		const i = expectedReturn / 12 / 100;
		const n = timePeriod * 12;
		const p = monthlyInvestment;
		
		let fv = 0;
		if (i === 0) {
			fv = p * n;
		} else {
			fv = p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
		}

		const invested = p * n;
		return {
			investedAmount: invested,
			estReturns: fv - invested,
			totalValue: fv,
		};
	}, [monthlyInvestment, expectedReturn, timePeriod]);

	const data = [
		{ name: "Invested Amount", value: investedAmount },
		{ name: "Est. Returns", value: estReturns },
	];

	const COLORS = ["#8b5cf6", "#10b981"]; // Purple for invested, Emerald for returns

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_400px]">
			<div className="space-y-6">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Systematic Investment Plan</CardTitle>
						<CardDescription>Calculate wealth generation over time through regular monthly investments in mutual funds or equities.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-8">
						<div className="space-y-4">
							<div className="flex justify-between items-end">
								<Label className="text-sm font-medium">Monthly Investment (₹)</Label>
								<div className="relative w-32">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
									<Input 
										type="number" 
										className="pl-7 h-9 font-mono text-sm" 
										value={monthlyInvestment} 
										onChange={(e) => setMonthlyInvestment(Number(e.target.value))} 
									/>
								</div>
							</div>
							<input
								type="range"
								min="500"
								max="1000000"
								step="500"
								value={monthlyInvestment}
								onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
								className="w-full accent-primary"
							/>
						</div>

						<div className="space-y-4">
							<div className="flex justify-between items-end">
								<Label className="text-sm font-medium">Expected Return Rate (p.a)</Label>
								<div className="relative w-24">
									<Input 
										type="number" 
										className="pr-7 h-9 font-mono text-sm" 
										value={expectedReturn} 
										onChange={(e) => setExpectedReturn(Number(e.target.value))} 
									/>
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
								</div>
							</div>
							<input
								type="range"
								min="1"
								max="30"
								step="0.5"
								value={expectedReturn}
								onChange={(e) => setExpectedReturn(Number(e.target.value))}
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
								max="40"
								step="1"
								value={timePeriod}
								onChange={(e) => setTimePeriod(Number(e.target.value))}
								className="w-full accent-primary"
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="space-y-6">
				<Card className="border-border/60 bg-card/50 backdrop-blur-sm h-full">
					<CardContent className="p-6 flex flex-col h-full">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Value</p>
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
									<div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
									<span className="text-sm font-medium text-muted-foreground">Invested Amount</span>
								</div>
								<span className="font-mono text-sm font-medium">{formatCurrency(investedAmount)}</span>
							</div>
							<div className="flex justify-between items-center p-3 rounded-lg bg-muted/40 border border-border/50">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-[#10b981]" />
									<span className="text-sm font-medium text-muted-foreground">Est. Returns</span>
								</div>
								<span className="font-mono text-sm font-medium text-emerald-500">{formatCurrency(estReturns)}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
