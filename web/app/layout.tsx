import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import "@/styles/clay.css";

export const metadata: Metadata = {
  title: "Suffer — the trip game",
  description: "A trip game for people who would rather be outside.",
  applicationName: "Suffer",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
