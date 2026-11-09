import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Year 8 Mathematics — Victorian Curriculum v2.0 (VCAA)",
  description:
    "Open-source digital mathematics textbook aligned to the Victorian Curriculum F-10 Version 2.0 (VCAA), verified with SymPy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
