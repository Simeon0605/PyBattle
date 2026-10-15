import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil — PyClash",
  description:
    "Deine ELO, Solo-Statistiken, Bestzeiten und Match-Historie auf einen Blick.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
