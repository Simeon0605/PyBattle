import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung / Privacy Policy - PyClash",
  description:
    "Datenschutzerklärung / Privacy policy von PyClash: verarbeitete Daten, technisch notwendige Cookies, eingesetzte Dienste (Vercel, Render, Supabase, Piston) und deine Rechte.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
