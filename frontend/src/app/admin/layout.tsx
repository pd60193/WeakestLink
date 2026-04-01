import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Host Control | The Weakest Link",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
