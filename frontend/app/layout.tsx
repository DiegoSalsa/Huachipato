import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Club Huachipato - Análisis Deportivo",
  description: "Plataforma de análisis deportivo y seguimiento médico del Club Deportivo Huachipato",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white font-display text-slate-900">
        {children}
      </body>
    </html>
  );
}
