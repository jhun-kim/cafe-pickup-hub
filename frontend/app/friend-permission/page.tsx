import Link from "next/link"

import { IconMotif } from "@/components/uiux/IconMotif"
import { MobileShell } from "@/components/uiux/MobileShell"
import { StatusPill } from "@/components/uiux/StatusPill"
import { permissionOptions } from "@/lib/uiux-data"

export default function FriendPermissionPage() {
  return (
    <MobileShell active="friend">
      <header className="mobile-header">
        <div>
          <h1>친구에게 픽업 권한 공유</h1>
          <p>대신 받을 사람과 만료 시간을 확인하세요.</p>
        </div>
      </header>

      <section className="detail-card">
        <div className="detail-card__icon">
          <IconMotif index={1} label="택배" size="lg" />
        </div>
        <div>
          <StatusPill tone="green">브라운핸즈 보관 중</StatusPill>
          <h2>작은 택배 · A102 선반</h2>
          <p>오늘 18:00까지 픽업 가능</p>
        </div>
      </section>

      <section className="mobile-section">
        <div className="section-row">
          <h2>픽업할 친구 선택</h2>
          <Link href="/">추가</Link>
        </div>
        <div className="friend-list">
          {permissionOptions.map((option) => (
            <button
              key={option.name}
              className={option.selected ? "friend-option is-selected" : "friend-option"}
              type="button"
            >
              <IconMotif index={4} label="" size="sm" />
              <span>
                <strong>{option.name}</strong>
                {option.relation}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="permission-card">
        <div>
          <span>권한 링크 만료</span>
          <strong>오늘 20:30</strong>
        </div>
        <div className="code-panel">
          <IconMotif index={3} label="확인 코드" size="lg" />
          <strong>739 284</strong>
          <span>카페 직원 확인용</span>
        </div>
        <button className="primary-button primary-button--full" type="button">
          권한 공유하기
        </button>
      </section>
    </MobileShell>
  )
}
