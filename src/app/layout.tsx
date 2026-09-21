import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { AuthGate } from "@/components/AuthGate";
import { AppChrome } from "@/components/AppChrome";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "HCM AI · PM",
  description: "HCM AI programme management. Milestones, critical path, OKRs, risks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <AuthProvider>
          <StoreProvider>
            <AuthGate>
              <AppChrome>{children}</AppChrome>
            </AuthGate>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
