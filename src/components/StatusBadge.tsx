import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "red" | "gold" | "gray" | "purple" | "brand";

const TONES: Record<Tone, string> = {
  green: "bg-green-soft text-green",
  amber: "bg-amber-soft text-amber",
  red: "bg-red-soft text-red",
  gold: "bg-gold-soft text-gold",
  gray: "bg-slate-100 text-ink-2",
  purple: "bg-purple-soft text-purple",
  brand: "bg-blue-50 text-brand",
};

export function StatusBadge({
  label,
  tone = "gray",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-4 uppercase tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
