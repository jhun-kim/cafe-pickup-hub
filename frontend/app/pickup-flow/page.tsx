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
          <h1>Hub 발견부터 보안 픽업까지 한 번에.</h1>
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
              <StatusPill tone={step.state === "준비됨" ? "green" : "neutral"}>{step.state}</StatusPill>
            </div>
            <IconMotif index={step.iconIndex} label="" size="lg" />
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            <div className="flow-card" data-noninteractive="flow-state-card">
              <strong>{step.detailTitle}</strong>
              <span>{step.detailMeta}</span>
            </div>
            <Link href={index === flowSteps.length - 1 ? "/friend-permission" : "/pickup-flow"} className="primary-button">
              {step.action}
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}
