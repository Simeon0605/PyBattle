import type { Difficulty } from "@/lib/types";

export function DifficultyBadge({ level }: { level: Difficulty }) {
  const cls =
    level === "easy"
      ? "border-accent text-accent"
      : level === "medium"
        ? "border-pink text-pink"
        : "border-signal bg-signal text-white";
  const label = level === "easy" ? "EASY" : level === "medium" ? "MED" : "HARD";
  return (
    <span className={`border px-2.5 py-0.5 text-[10px] tracking-[0.2em] ${cls}`}>
      {label}
    </span>
  );
}

export function Panel({
  children,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`panel ${className}`} {...rest}>
      {children}
    </div>
  );
}
