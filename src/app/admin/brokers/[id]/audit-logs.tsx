import { BrokerAuditLog, AuditLogChange } from "@/features/brokerage/brokerage.schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Bot, UserRound } from "lucide-react";

function formatTimestamp(iso: string) {
	return new Date(iso).toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
		timeZone: "Asia/Kolkata",
	});
}

function formatValue(val: unknown): string {
	if (val === null || val === undefined) return "—";
	if (typeof val === "object") return JSON.stringify(val);
	return String(val);
}

function ChangeList({ changesJson }: { changesJson: string }) {
	let changes: AuditLogChange[] = [];
	try {
		changes = JSON.parse(changesJson);
	} catch {
		return <p className="text-xs text-muted-foreground italic">Could not parse changes.</p>;
	}

	if (changes.length === 0) {
		return <p className="text-xs text-muted-foreground italic">No field changes recorded.</p>;
	}

	return (
		<div className="mt-2 space-y-1.5">
			{changes.map((change, idx) => (
				<div key={idx} className="rounded-md border border-border/50 bg-muted/30 p-2 text-xs font-mono">
					<span className="font-semibold text-foreground">{change.field}</span>
					<div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
						<span>
							<span className="text-red-500/80">− </span>
							{formatValue(change.from)}
						</span>
						<span>
							<span className="text-emerald-500/80">+ </span>
							{formatValue(change.to)}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

export default function BrokerAuditLogs({ logs }: { logs: BrokerAuditLog[] }) {
	return (
		<Card className="border-border/60 h-fit">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-base">
					<ClipboardList className="h-4 w-4 text-primary" />
					Change History
				</CardTitle>
				<CardDescription>
					{logs.length === 0
						? "No changes recorded yet."
						: `Last ${logs.length} changes for this broker.`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{logs.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
						<ClipboardList className="h-8 w-8 opacity-30" />
						<p>Changes you make will appear here.</p>
					</div>
				) : (
					<ScrollArea className="h-[600px] pr-2">
						<div className="space-y-4">
							{logs.map((log) => (
								<div key={log.$id} className="relative pl-5">
									{/* Timeline dot */}
									<span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary/30 ring-2 ring-primary/20" />
									{/* Vertical line */}
									<span className="absolute left-[4.5px] top-4 h-full w-px bg-border/50" />

									<div className="rounded-lg border border-border/60 bg-card p-3">
										<div className="flex items-center justify-between gap-2 flex-wrap">
											<span className="text-xs text-muted-foreground">
												{formatTimestamp(log.changedAt)}
											</span>
											<Badge
												variant="outline"
												className={
													log.source === "admin"
														? "border-primary/30 text-primary text-[10px] gap-1"
														: "border-muted-foreground/30 text-muted-foreground text-[10px] gap-1"
												}
											>
												{log.source === "admin" ? (
													<><UserRound className="h-2.5 w-2.5" /> Admin</>
												) : (
													<><Bot className="h-2.5 w-2.5" /> Scraper</>
												)}
											</Badge>
										</div>
										<ChangeList changesJson={log.changes} />
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}
