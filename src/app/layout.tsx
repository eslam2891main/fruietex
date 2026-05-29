import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "متجر فرويتكس | Fruietex - فواكه مجففة ومكسرات طبيعية فاخرة 🥭🍓",
  description: "اكتشف عالم المذاق الطبيعي الفاخر مع فرويتكس (Fruietex). نوفر لك تشكيلة راقية من أجود الفواكه المجففة، المكسرات النيئة والمحمصة، والتمور الفاخرة المنتقاة بعناية فائقة 100% طبيعية وخالية من المواد الحافظة. تسوق من أجل صحتك واستمتع بطاقة حيوية نقية مع توصيل فائق السرعة!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexSansArabic.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={ibmPlexSansArabic.className}>
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
