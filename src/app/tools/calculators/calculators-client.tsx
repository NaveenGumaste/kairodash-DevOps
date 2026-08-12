"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerConfig } from "@/features/brokerage/brokerage.schemas";
import BrokerageCalculatorClient from "./brokerage-calculator-client";
import SipCalculator from "./sip-calculator";
import FdCalculator from "./fd-calculator";
import { FileText, SplitSquareHorizontal } from "lucide-react";

interface Props {
	brokerConfigs: BrokerConfig[];
}

export type Category = "equity" | "fno" | "commodity_currency";

function CalculatorSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
				<div className="space-y-5">
					<div className="grid gap-4 md:grid-cols-3">
						{/* Metric Tiles Skeleton */}
						<div className="h-[110px] bg-card rounded-xl border border-border/50 shadow-sm p-4 flex flex-col justify-between">
							<div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-muted" /><div className="h-4 w-20 bg-muted rounded" /></div>
							<div className="h-8 w-24 bg-muted rounded mt-2" />
						</div>
						<div className="h-[110px] bg-card rounded-xl border border-border/50 shadow-sm p-4 flex flex-col justify-between">
							<div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-muted" /><div className="h-4 w-20 bg-muted rounded" /></div>
							<div className="h-8 w-24 bg-muted rounded mt-2" />
						</div>
						<div className="h-[110px] bg-card rounded-xl border border-border/50 shadow-sm p-4 flex flex-col justify-between">
							<div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-muted" /><div className="h-4 w-20 bg-muted rounded" /></div>
							<div className="h-8 w-24 bg-muted rounded mt-2" />
						</div>
					</div>
					{/* Trade Setup Skeleton */}
					<div className="h-[420px] bg-card rounded-xl border border-border/50 shadow-sm p-6 space-y-4">
						<div className="h-6 w-32 bg-muted rounded" />
						<div className="h-px w-full bg-border/50 my-4" />
						<div className="grid grid-cols-2 gap-4">
							<div className="h-10 bg-muted rounded-md" /><div className="h-10 bg-muted rounded-md" />
							<div className="h-10 bg-muted rounded-md" /><div className="h-10 bg-muted rounded-md" />
							<div className="h-10 bg-muted rounded-md" /><div className="h-10 bg-muted rounded-md" />
						</div>
					</div>
				</div>
				{/* Charge Summary Skeleton */}
				<div className="xl:w-[380px] space-y-4">
					<div className="h-[520px] bg-card rounded-xl border border-border/50 shadow-sm p-6 space-y-4">
						<div className="h-6 w-40 bg-muted rounded" />
						<div className="h-px w-full bg-border/50 my-4" />
						<div className="space-y-3">
							<div className="h-5 w-full bg-muted rounded" /><div className="h-5 w-full bg-muted rounded" />
							<div className="h-5 w-full bg-muted rounded" /><div className="h-5 w-full bg-muted rounded" />
							<div className="h-5 w-full bg-muted rounded" /><div className="h-5 w-full bg-muted rounded" />
							<div className="h-5 w-full bg-muted rounded" /><div className="h-5 w-full bg-muted rounded" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function CalculatorsClient({ brokerConfigs }: Props) {
	const [activeTab, setActiveTab] = useState("equity");
	const [renderedTab, setRenderedTab] = useState("equity");
	const [isLoading, setIsLoading] = useState(false);
	const [isComparing, setIsComparing] = useState(false);
	const [viewMode, setViewMode] = useState<"standard" | "contract-note">("standard");

	const isBrokerage = activeTab === "equity" || activeTab === "fno" || activeTab === "commodity_currency";

	const tabs = [
		{ id: "equity", label: "Equity" },
		{ id: "fno", label: "F&O" },
		{ id: "commodity_currency", label: "Commodity & Currency" },
		{ id: "sip", label: "SIP Calculator" },
		{ id: "fd", label: "FD Calculator" },
	];

	const handleTabChange = (newTab: string) => {
		if (newTab === activeTab) return;
		setActiveTab(newTab);
		setIsLoading(true);
		
		setTimeout(() => {
			setRenderedTab(newTab);
			setIsLoading(false);
		}, 800); // 800ms to ensure the skeleton is clearly visible before switching
	};

	return (
		<div className="flex flex-col w-full space-y-6">
			{/* Top Tool Bar with Tabs and Actions */}
			<div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-muted/30 p-2 rounded-lg border border-border/50">
				<Tabs value={activeTab} onValueChange={handleTabChange} className="w-full xl:w-auto">
					<TabsList className="bg-background/50 border border-border/40 p-1 h-auto grid grid-cols-2 md:flex md:flex-wrap gap-1 w-full xl:w-fit relative">
						{tabs.map((tab) => (
							<TabsTrigger 
								key={tab.id} 
								value={tab.id} 
								className="relative h-9 px-4 rounded-md text-sm font-medium data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:dark:!bg-transparent"
							>
								{activeTab === tab.id && (
									<motion.div
										layout
										layoutId="active-tab-indicator"
										className="absolute inset-0 bg-background dark:bg-input/30 shadow-sm border border-border/50 dark:border-input rounded-md z-0"
										transition={{ 
											type: "spring", 
											stiffness: 500, 
											damping: 40, 
											mass: 0.8 
										}}
									/>
								)}
								<span className="relative z-10">{tab.label}</span>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				{isBrokerage && (
					<div className="flex items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
						<button
							onClick={() => setIsComparing(!isComparing)}
							className={[
								"flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
								isComparing ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground bg-background/50 border border-border/40"
							].join(" ")}
						>
							<SplitSquareHorizontal className="h-4 w-4" />
							Compare Brokers
						</button>
						<button
							onClick={() => setViewMode(viewMode === "standard" ? "contract-note" : "standard")}
							className={[
								"flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
								viewMode === "contract-note" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground bg-background/50 border border-border/40"
							].join(" ")}
						>
							<FileText className="h-4 w-4" />
							Contract Note
						</button>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="focus-visible:outline-none relative min-h-[600px]">
				<AnimatePresence mode="popLayout">
					{isLoading ? (
						<motion.div 
							key="skeleton"
							initial={{ opacity: 0, filter: "blur(4px)", y: 8 }}
							animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
							exit={{ opacity: 0, filter: "blur(4px)", y: -8 }}
							transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
						>
							<CalculatorSkeleton />
						</motion.div>
					) : (
						<motion.div 
							key={renderedTab}
							initial={{ opacity: 0, filter: "blur(4px)", y: 8 }}
							animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
							exit={{ opacity: 0, filter: "blur(4px)", y: -8 }}
							transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
						>
							{isBrokerage && (
								<BrokerageCalculatorClient category={renderedTab as Category} brokerConfigs={brokerConfigs} isComparing={isComparing} viewMode={viewMode} />
							)}
							{renderedTab === "sip" && <SipCalculator />}
							{renderedTab === "fd" && <FdCalculator />}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
