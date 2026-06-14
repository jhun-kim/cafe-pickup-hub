import Link from "next/link"

import { IconMotif } from "@/components/uiux/IconMotif"
import { MobileShell } from "@/components/uiux/MobileShell"
import { StatusPill } from "@/components/uiux/StatusPill"
import { cafeSpots } from "@/lib/uiux-data"

export default function Home() {
  return (
    <MobileShell active="home">
      <header className="mobile-header">
        <div>
          <h1>안녕하세요, 지은님!</h1>
          <p>오늘도 안전한 픽업을 도와드릴게요.</p>
        </div>
        <button className="round-button" type="button" aria-label="알림">
          <IconMotif index={3} label="" size="sm" />
        </button>
      </header>

      <div className="search-row">
        <button className="location-chip" type="button">
          <IconMotif index={0} label="" size="sm" />
          서울 강남구 역삼동
        </button>
        <button className="round-button" type="button" aria-label="검색">
          <IconMotif index={4} label="" size="sm" />
        </button>
      </div>

      <section className="hero-card hero-card--home">
        <div>
          <h2>오늘 받을 수 있는 픽업 공간</h2>
          <p>카페의 여유 공간을 안전하게 이용해보세요.</p>
          <Link href="/pickup-flow" className="primary-button">
            근처 카페 보기
          </Link>
        </div>
        <div className="shelf-visual">
          <IconMotif index={2} label="보관 선반" size="lg" />
        </div>
      </section>

      <section className="mobile-section">
        <div className="section-row">
          <h2>내 주변 픽업 카페</h2>
          <Link href="/admin">지도 보기</Link>
        </div>
        <div className="cafe-list">
          {cafeSpots.map((spot) => (
            <article key={spot.name} className="cafe-row">
              <div className="thumb-box">
                <IconMotif index={0} label="카페 위치" size="md" />
              </div>
              <div className="cafe-row__body">
                <div className="cafe-row__title">
                  <strong>{spot.name}</strong>
                  <StatusPill tone={spot.statusTone === "open" ? "green" : "coral"}>
                    {spot.status}
                  </StatusPill>
                </div>
                <p>{spot.station}</p>
                <div className="cafe-row__meta">
                  <span>{spot.distance}</span>
                  <span>{spot.fee}</span>
                  <span>{spot.slots}</span>
                </div>
              </div>
              <Link href="/pickup-flow" className="small-cta">
                선택
              </Link>
            </article>
          ))}
        </div>
      </section>

      <Link href="/friend-permission" className="trust-banner">
        <IconMotif index={3} label="안전 확인" size="sm" />
        모든 픽업 공간은 카페 직원이 직접 관리하여 안전합니다.
        <span>›</span>
      </Link>
    </MobileShell>
  )
}
