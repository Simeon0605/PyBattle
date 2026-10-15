import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battle — PyClash",
  description:
    "1v1-Matchmaking nach ELO. Dasselbe Problem, 10 Minuten, erster korrekter Code gewinnt.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
