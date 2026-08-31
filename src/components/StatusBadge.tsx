import { STATUS_INFO, type PerfStatus } from "@/lib/perf";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status, className }: { status: PerfStatus; className?: string }) {
  const info = STATUS_INFO[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] font-medium",
        TONE[info.tone],
        className,
      )}
    >
      <span aria-hidden>{info.icone}</span>
      {info.label}
    </span>
  );
}

export function Pill({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "success" | "warning" | "destructive" | "info";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 font-mono text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}
