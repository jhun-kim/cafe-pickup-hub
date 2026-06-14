import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cafe Pickup Hub",
  description: "Cafes renting spare space as trusted neighborhood pickup hubs.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
