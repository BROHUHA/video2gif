import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Giffy - Video to GIF & Universal Converter",
  description: "Convert videos to high-quality GIFs, MP4, WebM, AVI, MOV, MP3, WAV, FLAC, and WebP instantly in your browser. Lightning fast, 100% private, no upload required. Free & open source.",
  keywords: [
    "video to gif",
    "gif converter",
    "video converter",
    "mp4 to gif",
    "webm converter",
    "free gif maker",
    "browser converter",
    "online video converter",
    "avi converter",
    "mov to gif",
    "extract audio",
    "mp3 extractor",
    "video trimmer",
    "video cropper",
    "speed control",
    "webp animator",
    "flac converter",
    "wav extractor",
    "no upload converter",
    "privacy first converter",
    "ffmpeg wasm"
  ],
  authors: [{ name: "Giffy Team", url: "https://giffy.app" }],
  creator: "Giffy",
  publisher: "Giffy",
  applicationName: "Giffy",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Technology",
  classification: "Video Converter",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/logo.png",
      },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://giffy.app",
    siteName: "Giffy",
    title: "Giffy - Video to GIF & Universal Converter",
    description: "Convert videos to GIFs, MP4, WebM, AVI, MOV, and extract audio instantly. Fast, private, browser-based, no uploads!",
    images: [
      {
        url: "/social-cover.png",
        width: 1200,
        height: 630,
        alt: "Giffy - Video to GIF Converter Interface",
        type: "image/png",
      },
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Giffy Logo",
      },
    ],
    countryName: "Worldwide",
  },
  twitter: {
    card: "summary_large_image",
    site: "@giffy_app",
    creator: "@giffy_app",
    title: "Giffy - Video to GIF & Universal Converter",
    description: "Convert videos to GIFs, MP4, WebM instantly in your browser. Fast, private, and free!",
    images: {
      url: "/social-cover.png",
      alt: "Giffy - Video to GIF Converter Interface",
    },
  },
  alternates: {
    canonical: "https://giffy.app",
  },
  other: {
    // Microsoft/Bing
    "msapplication-TileColor": "#111111",
    "msapplication-TileImage": "/logo.png",
    // Schema.org
    "og:video:tag": "video converter",
    // Pinterest
    "pinterest-rich-pin": "true",
    // LinkedIn
    "linkedin:owner": "giffy-app",
    // WhatsApp/Telegram preview
    "og:image:secure_url": "https://giffy.app/social-cover.png",
    // Slack
    "slack-app-id": "giffy",
    // Discord
    "discord:site": "Giffy",
    // Google
    "google-site-verification": "verification-code-here",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.variable}>
        {children}
      </body>
    </html>
  );
}
