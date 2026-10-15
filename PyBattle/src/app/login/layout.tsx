import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — PyClash",
  description:
    "Einloggen für Battles, Solo-Runs und ELO-Ranking. JWT + Refresh-Cookie-Flow.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
