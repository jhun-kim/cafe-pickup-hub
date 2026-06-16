import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "카페 픽업 허브",
  description: "동네 카페의 빈 공간을 안심 택배 픽업 거점으로 연결합니다.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
