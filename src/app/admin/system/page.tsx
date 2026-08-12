import Link from "next/link";
import { Server } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { listQueueJobs } from "@/features/queue/queue.repository";
import { listGeopoliticalAlerts } from "@/features/geopolitics/geopolitics.service";
import { listMarketBriefs } from "@/features/marketBrief/marketBrief.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function safe<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function SystemPage() {
  const [jobs, geoAlerts, briefs] = await Promise.all([
    safe(listQueueJobs(15), []),
    safe(listGeopoliticalAlerts(5), []),
    safe(listMarketBriefs(1), []),
  ]);

  const failedJobs = jobs.filter((job) => job.status === "failed").length;

  return (
    <div>
      <SectionHeading
        title="System Operations"
        description="Monitor system health, queue jobs, and manage your broker sessions."
      />

      <div className="mt-6 mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Queue Health</p>
          <div className="mt-3">
             <StatusPill tone={failedJobs ? "danger" : "good"}>
               {failedJobs ? `${failedJobs} failed` : "Healthy"}
             </StatusPill>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Geo Alerts</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{geoAlerts.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Stored dynamically</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Morning Briefs</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{briefs.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Stored dynamically</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Health Check</p>
          <div className="mt-3 flex items-center gap-2">
             <Link
               href="/api/health"
               className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
             >
               <Server className="h-4 w-4" aria-hidden="true" />
               `/api/health`
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
