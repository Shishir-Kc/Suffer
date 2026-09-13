import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suffer — The trip is the easy part",
  description: "A field guide to the trip, the quests, and the consequences.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
