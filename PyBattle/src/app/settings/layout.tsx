import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Einstellungen - PyClash",
  description:
    "Verwalte deinen PyClash-Account: Sprache wechseln, Passwort ändern, Konto löschen.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
