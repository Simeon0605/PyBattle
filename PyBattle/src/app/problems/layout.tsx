import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Probleme — PyClash",
  description:
    "Öffentliche Python-Aufgabensammlung mit versteckten Test-Cases und Bestzeiten.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
