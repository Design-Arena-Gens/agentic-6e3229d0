import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Police Parking 3D",
  description: "Steer the squad car into tight parking spots in this WebGL challenge."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-body">{children}</body>
    </html>
  );
}
