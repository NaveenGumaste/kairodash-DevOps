"use server";

import { revalidatePath } from "next/cache";
import { runIndianMarketIngestion } from "@/features/indianMarket/indianMarket.service";
import { auth } from "@/lib/admin-action-auth";
import {
  claimNextJob,
  completeJob,
  enqueueJob,
  deleteQueueJobsByName,
  failJob,
} from "@/features/queue/queue.repository";
import type { QueueJob } from "@/features/queue/queue.schemas";

export type RunIndianMarketActionState =
  | {
      status: "idle";
      message: string;
      processed: number | null;
    }
  | {
      status: "success";
      message: string;
      processed: number;
    }
  | {
      status: "error";
      message: string;
      processed: null;
    };

export async function runIndianMarketNowAction(
  _prevState: RunIndianMarketActionState,
  _formData: FormData,
): Promise<RunIndianMarketActionState> {
  void _prevState;
  void _formData;

  const session = await auth();
  if (!session.authorized) {
    throw new Error("Unauthorized admin action.");
  }

  let claimedJob: QueueJob | null = null;

  try {
    const deleted = await deleteQueueJobsByName("indian-market");
    await enqueueJob({
      name: "indian-market",
      payload: { reason: "manual reset" },
      maxAttempts: 3,
      runAt: new Date(),
    });
    const claimed = await claimNextJob("indian-market");

    if (!claimed) {
      throw new Error("Could not claim the refreshed Indian market job.");
    }

    claimedJob = claimed as QueueJob;
    const result = await runIndianMarketIngestion();
    await completeJob(claimed.$id);

    revalidatePath("/");
    revalidatePath("/alerts/indian-market");
    revalidatePath("/admin/jobs");

    return {
      status: "success",
      message: `Reset ${deleted} existing job${deleted === 1 ? "" : "s"} and processed ${result.processed.length} alert${result.processed.length === 1 ? "" : "s"}.`,
      processed: result.processed.length,
    };
  } catch (error) {
    if (claimedJob) {
      await failJob(claimedJob, error);
    }

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to run Indian market ingestion.",
      processed: null,
    };
  }
}
