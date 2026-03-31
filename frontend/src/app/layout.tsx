import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Weakest Link",
  description: "A fun, pastel-themed game show for friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
