import Link from "next/link"

import { IconMotif } from "@/components/uiux/IconMotif"
import { StatusPill } from "@/components/uiux/StatusPill"
import { flowSteps } from "@/lib/uiux-data"

export default function PickupFlowPage() {
  return (
    <main className="flow-stage">
      <header className="flow-header">
        <div>
          <p className="eyebrow">Safe pickup flow</p>
          <h1>카페 선택부터 픽업 코드까지 한 번에.</h1>
        </div>
        <Link href="/" className="ghost-button">
          홈으로
        </Link>
      </header>
      <section className="flow-board">
        {flowSteps.map((step, index) => (
          <article key={step.title} className="flow-phone">
            <div className="flow-phone__top">
              <span>{step.eyebrow}</span>
              <StatusPill tone={index === 2 ? "green" : "neutral"}>{index === 2 ? "준비됨" : "진행"}</StatusPill>
            </div>
            <IconMotif index={index === 0 ? 0 : index === 1 ? 2 : 3} label="" size="lg" />
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            <div className="flow-card">
              <strong>{index === 0 ? "브라운핸즈 역삼점" : index === 1 ? "A102 선반" : "픽업 코드"}</strong>
              <span>{index === 0 ? "120 m · ₩1,800" : index === 1 ? "오늘 18:00까지" : "482 913"}</span>
            </div>
            <Link href={index === 2 ? "/friend-permission" : "/pickup-flow"} className="primary-button">
              {step.action}
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}
