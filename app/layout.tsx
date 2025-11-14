import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excel Pro",
  description: "Next.js application with Tailwind CSS",
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

