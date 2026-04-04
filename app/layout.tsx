import type { Metadata } from "next";
import { Inter, Lato, Geist } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import NextAuthProvider from "./SessionProvider";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { StarsBackground } from "@/components/stars-background";
import { ShootingStars } from "@/components/Shooting-stars";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
  weight: ["400", "700", "300"],
});

export const metadata: Metadata = {
  title: "TaskFlow",
  description:
    "A beautiful and secure task management app powered by Convex.",
  icons: {
    icon: "/task.png",
    shortcut: "/task.png",
    apple: "/task.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${lato.className} relative antialiased`}>
        <div className="pointer-events-none fixed inset-0 z-0">
          <StarsBackground starDensity={0.0002} allStarsTwinkle twinkleProbability={0.9} />
          <ShootingStars
            minSpeed={12}
            maxSpeed={28}
            minDelay={1000}
            maxDelay={2800}
            starColor="#fff7ed"
            trailColor="#fb923c"
          />
        </div>
        <div className="relative z-10">
          <NextAuthProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </NextAuthProvider>
        </div>
        <Toaster
          theme="light"
          position="top-center"
          richColors
          expand={false}
          duration={3000}
          toastOptions={{
            // style: {
            //   background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,247,237,0.96))",
            //   border: "1px solid rgba(251, 146, 60, 0.45)",
            //   color: "#111827",
            //   backdropFilter: "blur(20px)",
            //   boxShadow: "0 12px 35px rgba(251, 146, 60, 0.28)",
            // },
          }}
        />
      </body>
    </html>
  );
}
