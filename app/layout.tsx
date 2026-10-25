import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gio Fiore",
  description: "Experience, projects, public software findings, and a few favorite things. A personal website by Gio Fiore.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
