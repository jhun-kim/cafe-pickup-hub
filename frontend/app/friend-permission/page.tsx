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
          <p>일회용 코드, PIN, 만료 시간과 취소 상태를 함께 관리하세요.</p>
        </div>
      </header>

      <section className="detail-card" data-noninteractive="package-summary">
        <div className="detail-card__icon">
          <IconMotif index={1} label="택배" size="lg" />
        </div>
        <div>
          <StatusPill tone="green">브라운핸즈 보관 중</StatusPill>
          <h2>작은 택배 · A102 선반</h2>
          <p>오늘 18:00까지 픽업 가능 · 직원 확인 완료</p>
        </div>
      </section>

      <section className="permission-state-grid" aria-label="위임 권한 상태">
        <div data-noninteractive="permission-state">
          <span>권한 상태</span>
          <strong>활성</strong>
        </div>
        <div data-noninteractive="permission-state">
          <span>만료</span>
          <strong>20:30</strong>
        </div>
        <div data-noninteractive="permission-state">
          <span>재사용</span>
          <strong>불가</strong>
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
          <span>민지에게 공유될 PickupAuthorization</span>
          <strong>QR + PIN + 1회 링크</strong>
        </div>
        <div className="code-panel" data-noninteractive="verification-preview">
          <IconMotif index={3} label="확인 코드" size="lg" />
          <strong>739 284</strong>
          <span>카페 직원 확인용 · 사용 즉시 만료</span>
        </div>
        <div className="permission-actions">
          <button className="primary-button primary-button--full" type="button">
            권한 공유하기
          </button>
          <button className="ghost-button ghost-button--danger" type="button">
            권한 취소
          </button>
        </div>
      </section>
    </MobileShell>
  )
}
