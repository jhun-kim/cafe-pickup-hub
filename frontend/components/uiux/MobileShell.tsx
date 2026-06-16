import Link from "next/link"
import type { ReactNode } from "react"

import { IconMotif } from "@/components/uiux/IconMotif"

type MobileShellProps = {
  readonly active: "home" | "search" | "pickup" | "friend" | "more"
  readonly children: ReactNode
}

const navItems = [
  { key: "home", label: "홈", href: "/", icon: 0 },
  { key: "search", label: "카페 찾기", href: "/", icon: 4 },
  { key: "pickup", label: "예약", href: "/pickup-flow", icon: 1 },
  { key: "friend", label: "친구 공유", href: "/friend-permission", icon: 3 },
  { key: "more", label: "도움", href: "/#help", icon: 5 },
] as const

export function MobileShell({ active, children }: MobileShellProps) {
  return (
    <main className="mockup-stage mockup-stage--mobile">
      <div className="phone-frame">
        <div className="phone-status">
          <span>9:41</span>
          <span className="phone-status__icons">●●●</span>
        </div>
        <div className="phone-content">{children}</div>
        <nav className="bottom-nav" aria-label="모바일 앱 내비게이션">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={item.key === active ? "bottom-nav__item is-active" : "bottom-nav__item"}
            >
              <IconMotif index={item.icon} label="" size="sm" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  )
}
