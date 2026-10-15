import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrieren — PyClash",
  description:
    "Account erstellen mit Start-ELO 1000. Erste Battle in unter zwei Minuten.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
