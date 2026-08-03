import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pawz",
  description: "Pet health records, reminders, and care cards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
