import type { Metadata } from "next";
import { Inter, Lato, Geist } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import NextAuthProvider from "./SessionProvider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
  weight: ["400", "700", "300"],
});

export const metadata: Metadata = {
  title: "TaskFlow — Smart Task Manager",
  description:
    "A beautiful and secure task management app powered by Convex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${lato.className} antialiased`}>
        <NextAuthProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
