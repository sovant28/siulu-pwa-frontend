import "./globals.css";

export const metadata = {
  title: "Siulu - Panduan Wisata Tana Toraja & Pemandu AI",
  description: "Temukan destinasi wisata alam, budaya, kuliner, dan event ritual adat Rambu Solo' di Tana Toraja bersama Mebali AI, asisten pemandu digital pribadi Anda.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Siulu Tana Toraja",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4C1D95",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-[#0F172A]">
      <body className="font-sans antialiased max-w-md mx-auto bg-white min-h-screen relative border-x border-slate-200/20">
        {children}
      </body>
    </html>
  );
}
