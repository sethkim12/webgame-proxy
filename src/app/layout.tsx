import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unity WebGL Game",
  description: "세로형 웹게임 페이지",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head />
      <body className="antialiased bg-white text-black">{children}</body>
    </html>
  );
}
