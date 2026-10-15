import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solo — PyClash",
  description:
    "Solo-Run gegen den Server-Timer. Mindestens 5 Sekunden, maximal 15 Minuten, ein Submit.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
