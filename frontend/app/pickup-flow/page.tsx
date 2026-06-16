import Link from "next/link"

import { BookingForm } from "@/components/pickup/BookingForm"
import { IconMotif } from "@/components/uiux/IconMotif"
import { StatusPill } from "@/components/uiux/StatusPill"
import { getPickupFlowData } from "@/lib/api-view-models"

type PickupFlowPageProps = {
  readonly searchParams?: Promise<{
    readonly hubId?: string
  }>
}

const progressSteps = ["카페 선택", "예약", "입고 확인", "픽업/공유"] as const

export default async function PickupFlowPage({ searchParams }: PickupFlowPageProps) {
  const params = await searchParams
  const { selectedHub, sourceView, steps } = await getPickupFlowData(params?.hubId)
  const readyStep = steps.find((step) => step.state === "준비됨") ?? steps[steps.length - 1]

  return (
    <main className="flow-stage flow-stage--task-first">
      <header className="flow-header flow-header--compact">
        <div>
          <p className="eyebrow">예약 중심 픽업 플로우</p>
          <h1>지금 할 일만 크게, 엄지손가락으로 예약까지.</h1>
        </div>
        <div className="flow-header__actions">
          <div className="api-source-banner api-source-banner--flow" data-api-source={sourceView.source.kind}>
            <strong>{sourceView.label}</strong>
            <span>{sourceView.detail}</span>
          </div>
          <Link href="/" className="ghost-button">
            홈으로
          </Link>
        </div>
      </header>

      <section className="pickup-task-panel" aria-labelledby="pickup-task-title">
        <div className="pickup-task-panel__summary">
          <div>
            <p className="eyebrow">선택한 픽업 카페</p>
            <h2 id="pickup-task-title">{selectedHub.name}</h2>
            <p>
              {selectedHub.priceLabel} · 보관함을 먼저 잡고, 입고 알림이 오면 코드로 찾아가세요.
            </p>
          </div>
          <StatusPill tone="green">추천 카페</StatusPill>
        </div>

        <ol className="pickup-progress" aria-label="픽업 진행 단계">
          {progressSteps.map((label, index) => (
            <li key={label} className={index <= 1 ? "is-current" : undefined}>
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ol>

        <BookingForm
          apiSourceKind={sourceView.source.kind}
          hubId={selectedHub.id}
          hubName={selectedHub.name}
          priceLabel={selectedHub.priceLabel}
        />
      </section>

      <section className="flow-board flow-board--compact" aria-labelledby="pickup-guide-title">
        <div className="flow-board__intro">
          <p className="eyebrow">전체 흐름</p>
          <h2 id="pickup-guide-title">예약 후에는 이렇게 진행돼요</h2>
        </div>
        {steps.map((step, index) => (
          <article key={step.title} className={step === readyStep ? "flow-phone is-ready" : "flow-phone"}>
            <div className="flow-phone__top">
              <span>{step.eyebrow}</span>
              <StatusPill tone={step.state === "준비됨" ? "green" : "neutral"}>{step.state}</StatusPill>
            </div>
            <IconMotif index={step.iconIndex} size="lg" />
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <div className="flow-card" data-noninteractive="flow-state-card">
              <strong>{step.detailTitle}</strong>
              <span>{step.detailMeta}</span>
            </div>
            <Link href={index === steps.length - 1 ? "/friend-permission" : "#pickup-booking"} className="ghost-button">
              {step.action}
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}
