import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/600-italic.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ShipLane - Put your app online. Just ask your agent.",
  description: "The zero-config deployment platform for AI coding agents and non-technical creators. Deploy instantly without Vercel or cloud complexity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
