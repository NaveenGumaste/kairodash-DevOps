import { clsx } from "@/lib/clsx";

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold tracking-wide transition-colors",
        tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400",
        tone === "warn" && "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400",
        tone === "danger" && "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400",
        tone === "neutral" && "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800/40 dark:bg-zinc-900/20 dark:text-zinc-400",
      )}
    >
      {children}
    </span>
  );
}
