import "server-only";

import { Client, Databases, Storage } from "appwrite";
import { appwriteStatus, env } from "@/lib/env";

// ── Singletons — reused across requests within the same serverless worker ─────
let _client: Client | null = null;
let _databases: Databases | null = null;
let _storage: Storage | null = null;

export function getAppwriteClient() {
  if (_client) return _client;

  const status = appwriteStatus();
  if (!status.configured) {
    throw new Error(
      `Appwrite is not configured. Missing: ${status.missing.join(", ")}`,
    );
  }

  _client = new Client()
    .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(env.APPWRITE_API_KEY!);

  return _client;
}

export function getDatabases() {
  if (!_databases) _databases = new Databases(getAppwriteClient());
  return _databases;
}

export function getStorage() {
  if (!_storage) _storage = new Storage(getAppwriteClient());
  return _storage;
}

export function getDatabaseId() {
  if (!env.APPWRITE_DATABASE_ID) {
    throw new Error("APPWRITE_DATABASE_ID is not configured.");
  }
  return env.APPWRITE_DATABASE_ID;
}

