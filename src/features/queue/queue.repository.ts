import "server-only";

import { ID, Query } from "appwrite";
import { randomUUID } from "node:crypto";
import { getDatabaseId, getDatabases } from "@/lib/appwrite";
import { collections, appwriteStatus } from "@/lib/env";
import { rGet, rSet } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";
import {
  queueJobCreateSchema,
  type QueueJob,
} from "@/features/queue/queue.schemas";

const collectionId = collections.queueJobs;

export async function listQueueJobs(limit = 25) {
  if (!appwriteStatus().configured) {
    return [] as QueueJob[];
  }

  const cacheKey = CK.queueJobs(limit);
  const cached = await rGet<QueueJob[]>(cacheKey);
  if (cached) return cached;

  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    collectionId,
    [Query.orderDesc("runAt"), Query.limit(limit)],
  );

  const jobs = response.documents as unknown as QueueJob[];
  rSet(cacheKey, jobs, TTL.queueJobs).catch(() => {});
  return jobs;
}

export async function deleteQueueJobsByName(name: string) {
  if (!appwriteStatus().configured) {
    return 0;
  }

  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    collectionId,
    [Query.equal("name", name), Query.limit(100)],
  );

  for (const document of response.documents) {
    await getDatabases().deleteDocument(
      getDatabaseId(),
      collectionId,
      document.$id,
    );
  }

  return response.documents.length;
}

export async function enqueueJob(input: unknown) {
  const data = queueJobCreateSchema.parse(input);
  const now = new Date().toISOString();

  return getDatabases().createDocument(
    getDatabaseId(),
    collectionId,
    ID.unique(),
    {
      name: data.name,
      status: "queued",
      payloadJson: JSON.stringify(data.payload),
      attempts: 0,
      maxAttempts: data.maxAttempts,
      runAt: data.runAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    },
  );
}

export async function claimNextJob(name: string, lockMs = 60_000) {
  const now = new Date();
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    collectionId,
    [
      Query.equal("name", name),
      Query.equal("status", "queued"),
      Query.lessThanEqual("runAt", now.toISOString()),
      Query.orderAsc("runAt"),
      Query.limit(1),
    ],
  );

  const job = response.documents[0] as unknown as QueueJob | undefined;

  if (!job) {
    return null;
  }

  const lockToken = randomUUID();
  const lockedUntil = new Date(now.getTime() + lockMs).toISOString();

  const claimed = await getDatabases().updateDocument(
    getDatabaseId(),
    collectionId,
    job.$id,
    {
      status: "processing",
      attempts: job.attempts + 1,
      startedAt: now.toISOString(),
      lockedUntil,
      lockToken,
      updatedAt: now.toISOString(),
    },
  );

  return claimed as unknown as QueueJob;
}

export async function completeJob(jobId: string) {
  const now = new Date().toISOString();

  return getDatabases().updateDocument(getDatabaseId(), collectionId, jobId, {
    status: "completed",
    completedAt: now,
    lockedUntil: undefined,
    lockToken: undefined,
    updatedAt: now,
  });
}

export async function failJob(job: QueueJob, error: unknown) {
  const now = new Date().toISOString();
  const retry = job.attempts < job.maxAttempts;
  const nextRun = new Date(Date.now() + Math.min(job.attempts + 1, 5) * 60_000);
  const message = error instanceof Error ? error.message : "Unknown job error";

  return getDatabases().updateDocument(getDatabaseId(), collectionId, job.$id, {
    status: retry ? "queued" : "failed",
    runAt: retry ? nextRun.toISOString() : job.runAt,
    lockedUntil: undefined,
    lockToken: undefined,
    lastError: message.slice(0, 1900),
    updatedAt: now,
  });
}
