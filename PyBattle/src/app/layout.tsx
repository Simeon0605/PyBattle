import type { Metadata } from "next";
import { Press_Start_2P, Space_Mono, Unbounded } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

const wide = Unbounded({
  variable: "--font-wide",
  weight: "700",
  subsets: ["latin"],
});

const mono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PyClash — 1v1 Python Battles",
  description:
    "Echtzeit Coding-Battles, Solo-Mode mit Server-Timing und ELO-Leaderboard.",
  openGraph: {
    title: "PyClash — 1v1 Python Battles",
    description:
      "Tritt in Echtzeit-Python-Battles an: Solo gegen die Uhr oder 1v1 im Matchmaking. ELO, Leaderboard, versteckte Tests.",
    type: "website",
    locale: "de_DE",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${pixel.variable} ${wide.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
