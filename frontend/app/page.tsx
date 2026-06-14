import Link from "next/link"

import { IconMotif } from "@/components/uiux/IconMotif"
import { MobileShell } from "@/components/uiux/MobileShell"
import { StatusPill } from "@/components/uiux/StatusPill"
import { getHomePickupData } from "@/lib/api-view-models"

export default async function Home() {
  const { mapSummary, sourceView, spots } = await getHomePickupData()

  return (
    <MobileShell active="home">
      <header className="mobile-header">
        <div>
          <p className="eyebrow">Nearby safe pickup hubs</p>
          <h1>근처 안전 카페 픽업 허브</h1>
          <p>집 앞 분실 걱정 없이 오늘 받을 카페 보관 공간을 찾으세요.</p>
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
          <div className="api-source-banner" data-api-source={sourceView.source.kind}>
            <strong>{sourceView.label}</strong>
            <span>{sourceView.detail}</span>
          </div>
          <div className="trust-chip-row" aria-label="안전 상태">
            <StatusPill tone="green">직원 확인</StatusPill>
            <StatusPill tone="neutral">1회 코드</StatusPill>
            <StatusPill tone="neutral">도보 3분</StatusPill>
          </div>
          <h2>주변 카페가 안전한 수령 거점이 됩니다.</h2>
          <p>Hub 탐색, StorageSlot 예약, Package 입고 알림, 보안 픽업까지 한 번에 진행합니다.</p>
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
          <Link href="/pickup-flow">리스트로 보기</Link>
        </div>
        <div className="nearby-map" data-noninteractive="map-preview" aria-label="근처 허브 지도 미리보기">
          <span className="nearby-map__pin nearby-map__pin--one" data-noninteractive="map-pin" />
          <span className="nearby-map__pin nearby-map__pin--two" data-noninteractive="map-pin" />
          <span className="nearby-map__pin nearby-map__pin--three" data-noninteractive="map-pin" />
          <div className="nearby-map__label" data-noninteractive="map-summary">
            <strong>역삼역 반경 600 m</strong>
            <span>{mapSummary}</span>
          </div>
        </div>
        <div className="cafe-list">
          {spots.map((spot) => (
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
                  <span>{spot.trust}</span>
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
        친구나 가족에게도 만료되는 1회 권한만 공유됩니다.
        <span>›</span>
      </Link>
    </MobileShell>
  )
}
