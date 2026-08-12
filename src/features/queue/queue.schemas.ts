import { z } from "zod";

export const queueJobStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const queueJobCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  payload: z.record(z.string(), z.unknown()).default({}),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  runAt: z.coerce.date().default(() => new Date()),
});

export const jobRunSchema = z.object({
  reason: z.string().optional(),
});

export type QueueJobStatus = z.infer<typeof queueJobStatusSchema>;

export type QueueJob = {
  $id: string;
  name: string;
  status: QueueJobStatus;
  payloadJson?: string;
  attempts: number;
  maxAttempts: number;
  runAt: string;
  lockedUntil?: string;
  lockToken?: string;
  lastError?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};
