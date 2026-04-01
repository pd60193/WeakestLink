import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Player | The Weakest Link",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden">
      {children}
    </div>
  );
}
