import "./globals.css";

export const metadata = {
  title: "Siulu App",
  description: "Explore Tana Toraja with AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Siulu App",
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
