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
          <p className="eyebrow">가까운 안심 픽업</p>
          <h1>오늘 받을 택배, 가까운 카페에 안전하게</h1>
          <p>퇴근길에 들르기 쉬운 보관 카페를 한눈에 고르세요.</p>
        </div>
        <span className="round-button" data-noninteractive="home-alert-preview" aria-hidden="true">
          <IconMotif index={3} label="" size="sm" />
        </span>
      </header>

      <div className="search-row">
        <span className="location-chip" data-noninteractive="home-location-preview">
          <IconMotif index={0} label="" size="sm" />
          서울 강남구 역삼동
        </span>
        <span className="round-button" data-noninteractive="home-search-preview" aria-hidden="true">
          <IconMotif index={4} label="" size="sm" />
        </span>
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
          <h2>엄지 하나로 카페 선택부터 픽업까지.</h2>
          <p>카페 찾기, 보관 예약, 입고 알림, 픽업 코드 확인을 쉬운 말로 안내합니다.</p>
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
              <Link href={`/pickup-flow?hubId=${spot.id}`} className="small-cta">
                선택
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="help" className="trust-banner trust-banner--help" aria-labelledby="help-title">
        <IconMotif index={5} size="sm" />
        <span>
          <strong id="help-title">도움이 필요하세요?</strong>
          카페 직원에게 예약 화면과 1회 코드를 보여주면 보관 위치를 바로 확인할 수 있어요.
        </span>
      </section>
    </MobileShell>
  )
}
