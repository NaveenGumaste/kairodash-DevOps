"use client";

import { useState } from "react";
import { FileText, Newspaper, RefreshCw } from "lucide-react";
import { clsx } from "@/lib/clsx";

type FetchState = {
  loading: boolean;
  error?: string;
  data?: unknown[];
};

const tabs = [
  { key: "news", label: "News", icon: Newspaper },
  { key: "filings", label: "Filings", icon: FileText },
  { key: "results", label: "Results", icon: FileText },
];

export function StockDetailClient({ symbol }: { symbol: string }) {
  const [active, setActive] = useState("news");
  const [state, setState] = useState<FetchState>({ loading: false });

  async function load(tab = active) {
    setActive(tab);
    setState({ loading: true });

    try {
      const response = await fetch(`/api/stocks/${symbol}/${tab}`, {
        cache: "no-store",
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Request failed");
      }

      setState({ loading: false, data: body[tab] ?? [] });
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Request failed",
      });
    }
  }

  return (
    <section className="mt-5 rounded-md border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-3">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => load(tab.key)}
                className={clsx(
                  "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium",
                  active === tab.key
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium hover:bg-zinc-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>
      <div className="min-h-56 p-4">
        {state.loading ? <p className="text-sm text-zinc-500">Loading {active}...</p> : null}
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        {state.data?.length ? (
          <div className="space-y-3">
            {state.data.map((item) => {
              const record = item as { title?: string; url?: string; source?: string; publishedAt?: string };
              const key = `${record.url ?? record.title ?? "item"}-${record.publishedAt ?? ""}`;
              return (
                <article key={key} className="rounded-md border border-zinc-200 p-3">
                  <h3 className="text-sm font-semibold">{record.title ?? "Untitled item"}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {record.source ?? active} {record.publishedAt ? `· ${record.publishedAt}` : ""}
                  </p>
                  {record.url ? (
                    <a
                      href={record.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-emerald-800"
                    >
                      Open source
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : !state.loading && !state.error ? (
          <p className="text-sm text-zinc-500">
            Select a tab or refresh to fetch provider data for {symbol}.
          </p>
        ) : null}
      </div>
    </section>
  );
}
