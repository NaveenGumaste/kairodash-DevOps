import React from "react";

export function CalculatorSkeleton() {
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

export function DashboardSkeleton() {
	return (
		<div className="flex flex-col gap-4 flex-1 min-h-0 animate-pulse">
			<div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
				<div className="space-y-2">
					<div className="h-7 w-64 bg-muted rounded-md" />
					<div className="h-4 w-96 bg-muted rounded-md" />
				</div>
				<div className="flex gap-2">
					<div className="h-10 w-32 bg-muted rounded-lg" />
					<div className="h-10 w-40 bg-muted rounded-lg" />
				</div>
			</div>
			<div className="shrink-0 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
				{[1, 2, 3].map((i) => (
					<div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between h-[120px]">
						<div className="flex items-center justify-between">
							<div className="h-3 w-24 bg-muted rounded" />
							<div className="h-7 w-7 bg-muted rounded-md" />
						</div>
						<div>
							<div className="h-8 w-16 bg-muted rounded" />
							<div className="mt-2 h-3 w-32 bg-muted rounded" />
						</div>
					</div>
				))}
			</div>
			<div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm mt-2">
				<div className="shrink-0 flex items-center justify-between border-b border-border bg-muted/20 px-5 py-3">
					<div className="h-5 w-48 bg-muted rounded" />
					<div className="h-4 w-24 bg-muted rounded" />
				</div>
				<div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div key={i} className="h-32 bg-muted/50 rounded-lg border border-border/50" />
					))}
				</div>
			</div>
		</div>
	);
}

export function StocksSkeleton() {
	return (
		<div className="flex-1 space-y-4 animate-pulse">
			<div className="space-y-2">
				<div className="h-8 w-32 bg-muted rounded-md" />
				<div className="h-4 w-96 bg-muted rounded-md" />
			</div>
			<div className="overflow-hidden rounded-md border border-border bg-card mt-6">
				<div className="flex items-center gap-2 border-b border-border px-4 py-3">
					<div className="h-4 w-4 bg-muted rounded" />
					<div className="h-4 w-32 bg-muted rounded" />
				</div>
				<div className="divide-y divide-border">
					{[1, 2, 3, 4, 5].map((i) => (
						<div key={i} className="grid gap-2 p-4 md:grid-cols-[1fr_auto]">
							<div className="space-y-2">
								<div className="h-5 w-16 bg-muted rounded" />
								<div className="h-4 w-48 bg-muted rounded" />
							</div>
							<div className="flex items-center gap-2">
								<div className="h-6 w-16 bg-muted rounded-full" />
								<div className="h-6 w-16 bg-muted rounded-full" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function GenericListSkeleton() {
	return (
		<div className="flex-1 space-y-4 animate-pulse">
			<div className="space-y-2">
				<div className="h-8 w-48 bg-muted rounded-md" />
				<div className="h-4 w-[400px] bg-muted rounded-md" />
			</div>
			<div className="overflow-hidden rounded-md border border-border bg-card mt-6">
				<div className="flex items-center gap-2 border-b border-border px-4 py-3">
					<div className="h-4 w-4 bg-muted rounded" />
					<div className="h-4 w-32 bg-muted rounded" />
				</div>
				<div className="p-4 space-y-4">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="h-24 bg-muted/50 rounded-lg border border-border/50" />
					))}
				</div>
			</div>
		</div>
	);
}

export function GenericGridSkeleton() {
	return (
		<div className="flex-1 space-y-4 animate-pulse">
			<div className="space-y-2">
				<div className="h-8 w-48 bg-muted rounded-md" />
				<div className="h-4 w-[400px] bg-muted rounded-md" />
			</div>
			<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div key={i} className="h-48 bg-card rounded-xl border border-border shadow-sm p-4 space-y-4">
						<div className="h-6 w-3/4 bg-muted rounded" />
						<div className="space-y-2">
							<div className="h-4 w-full bg-muted rounded" />
							<div className="h-4 w-5/6 bg-muted rounded" />
							<div className="h-4 w-4/6 bg-muted rounded" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function PageSkeleton({ route }: { route: string }) {
	if (route === "/") return <DashboardSkeleton />;
	if (route.startsWith("/stocks")) return <StocksSkeleton />;
	if (route.startsWith("/tools/calculators")) return <CalculatorSkeleton />;
	if (route.startsWith("/alerts")) return <GenericGridSkeleton />;
	if (route.startsWith("/briefs")) return <GenericListSkeleton />;
	if (route.startsWith("/admin")) return <GenericListSkeleton />;
	
	return <GenericListSkeleton />;
}
