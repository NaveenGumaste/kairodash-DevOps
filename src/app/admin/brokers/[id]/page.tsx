import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBrokerConfigById, getAuditLogsForBroker } from "@/features/brokerage/brokerage.repository";
import BrokerEditForm from "./edit-form";
import BrokerAuditLogs from "./audit-logs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	return {
		title: `Edit ${id} — Broker Admin`,
	};
}

export default async function BrokerEditPage({ params }: Props) {
	const { id } = await params;

	const [broker, auditLogs] = await Promise.all([
		getBrokerConfigById(id),
		getAuditLogsForBroker(id, 20),
	]);

	if (!broker) {
		notFound();
	}

	return (
		<div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
			<div className="flex items-center gap-4">
				<Link
					href="/admin/brokers"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Brokers
				</Link>
			</div>

			<div>
				<h2 className="text-3xl font-bold tracking-tight">{broker.name}</h2>
				<p className="text-muted-foreground mt-1">
					Edit charge configuration. Changes are logged automatically.
				</p>
			</div>

			<div className="grid gap-8 xl:grid-cols-[1fr_420px]">
				<BrokerEditForm broker={broker} />
				<BrokerAuditLogs logs={auditLogs} />
			</div>
		</div>
	);
}
