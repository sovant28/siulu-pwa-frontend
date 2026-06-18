import "./globals.css";

export const metadata = {
  title: "Siulu - Panduan Wisata Tana Toraja & Pemandu AI",
  description: "Temukan destinasi wisata alam, budaya, kuliner, dan event ritual adat Rambu Solo' di Tana Toraja bersama Mebali AI, asisten pemandu digital pribadi Anda.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Siulu Toraja",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#BE1641",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl">
        {children}
      </body>
    </html>
  );
}
