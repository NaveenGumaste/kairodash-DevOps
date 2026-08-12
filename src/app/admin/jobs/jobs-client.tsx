"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import {
  runIndianMarketNowAction,
  type RunIndianMarketActionState,
} from "./actions";

const initialState: RunIndianMarketActionState = {
  status: "idle",
  message: "Ready",
  processed: null,
};

export function JobsClient() {
  const [state, action, pending] = useActionState(
    runIndianMarketNowAction,
    initialState,
  );

  return (
    <form action={action} className="flex flex-col gap-2 sm:items-start">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        <RefreshCw
          className={`h-4 w-4 ${pending ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {pending ? "Resetting" : "Reset & rerun Indian market"}
      </button>
      {state.status !== "idle" ? (
        <div className="max-w-xl rounded-md border border-zinc-200 bg-white p-3 text-xs shadow-sm">
          <p className="font-medium">{state.message}</p>
          {state.processed !== null ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusPill tone="good">Processed {state.processed}</StatusPill>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
