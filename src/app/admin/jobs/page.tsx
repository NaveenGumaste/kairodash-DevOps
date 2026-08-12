import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { listQueueJobs } from "@/features/queue/queue.repository";
import { JobsClient } from "./jobs-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JobsPage() {
  const jobs = await listQueueJobs(100);

  return (
    <div>
      <SectionHeading
        title="Job Monitor"
        description="Queue-backed cron state for scheduled ingestion and retry visibility."
        action={<JobsClient />}
      />
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Run at</th>
                <th className="px-4 py-3">Last error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.length ? (
                jobs.map((job) => (
                  <tr key={job.$id}>
                    <td className="px-4 py-3 font-medium">{job.name}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        tone={
                          job.status === "failed"
                            ? "danger"
                            : job.status === "completed"
                              ? "good"
                              : "neutral"
                        }
                      >
                        {job.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      {job.attempts}/{job.maxAttempts}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{job.runAt}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {job.lastError ?? ""}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    No queue jobs are stored yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
