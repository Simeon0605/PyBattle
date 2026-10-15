import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — PyClash",
  description:
    "Globales ELO-Ranking aller PyClash-Spieler mit Wins, Losses und Season-Verlauf.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
