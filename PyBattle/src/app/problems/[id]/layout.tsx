import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Problem — PyClash",
  description:
    "Python-Aufgabe mit Beispiel-Input/-Output und versteckten Test-Cases.",
};

export default function RouteLayout({ children }: LayoutProps<"/">) {
  return children;
}
