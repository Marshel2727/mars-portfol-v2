import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import RegisterSW from "../components/RegisterSW";
import SWRProvider from "../components/SWRProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme";
import { siteUrl } from "@/lib/seo";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Marshel — Full-Stack, IoT & Systems Engineer",
  description:
    "Portofolio Marshel, mahasiswa Computer Engineering berfokus pada Full-Stack Web Development, REST API, sistem IoT, dan arsitektur data terintegrasi.",
  keywords: [
    "Marshel",
    "Computer Engineering",
    "Full-Stack Developer",
    "IoT Engineer",
    "Next.js Portfolio",
    "ESP32",
    "Python",
    "TypeScript",
  ],
  authors: [{ name: "Marshel" }],
  creator: "Marshel",
  publisher: "Marshel",
  manifest: "/manifest.json",
  openGraph: {
    title: "Marshel — Full-Stack, IoT & Systems Engineer",
    description:
      "Membangun software yang terhubung dengan dunia nyata—dari antarmuka web, API, database, hingga integrasi perangkat IoT.",
    url: siteUrl,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Marshel Portfolio" }],
    siteName: "Marshel Portfolio",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marshel — Full-Stack, IoT & Systems Engineer",
    description: "Full-Stack Web Development, REST API, dashboard, dan integrasi Internet of Things.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-theme="light"
      suppressHydrationWarning
      className={`${newsreader.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <RegisterSW />
          <SWRProvider>{children}</SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
