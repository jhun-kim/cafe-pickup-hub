import Link from "next/link"
import type { ReactNode } from "react"

import { IconMotif } from "@/components/uiux/IconMotif"

type DashboardShellProps = {
  readonly title: string
  readonly subtitle: string
  readonly active: "host" | "admin"
  readonly children: ReactNode
}

const navItems = [
  { label: "대시보드", href: "/host", icon: 0 },
  { label: "보관함 관리", href: "/host", icon: 2 },
  { label: "입출고 관리", href: "/host", icon: 1 },
  { label: "운영 모니터", href: "/admin", icon: 4 },
  { label: "검증/분쟁", href: "/admin", icon: 3 },
  { label: "정산/수익", href: "/host", icon: 5 },
] as const

export function DashboardShell({ title, subtitle, active, children }: DashboardShellProps) {
  return (
    <main className="dashboard-stage">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <IconMotif index={0} label="카페 허브" size="md" />
          <div>
            <strong>{active === "host" ? "모카우드 카페" : "카페픽업 운영"}</strong>
            <span>{active === "host" ? "호스트 인증 완료" : "운영자 콘솔"}</span>
          </div>
        </div>
        <nav aria-label="대시보드 내비게이션">
          {navItems.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={
                (active === "host" && item.href === "/host") ||
                (active === "admin" && item.href === "/admin")
                  ? "dashboard-nav-item is-active"
                  : "dashboard-nav-item"
              }
            >
              <IconMotif index={item.icon} label="" size="sm" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="dashboard-header__actions">
            <Link href="/" className="ghost-button">
              사용자 앱
            </Link>
            <Link href={active === "host" ? "/admin" : "/host"} className="primary-button">
              {active === "host" ? "운영 콘솔" : "호스트 화면"}
            </Link>
          </div>
        </header>
        {children}
      </section>
    </main>
  )
}
