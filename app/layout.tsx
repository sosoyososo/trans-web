import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Translation Compare",
  description: "Compare original and translated text side by side",
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
