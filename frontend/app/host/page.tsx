import { HostOperationBoard } from "@/components/host/HostOperationBoard"
import { DashboardShell } from "@/components/uiux/DashboardShell"
import { IconMotif } from "@/components/uiux/IconMotif"
import { StatusPill } from "@/components/uiux/StatusPill"
import { loadHostOperations } from "@/lib/api-client"

export default async function HostPage() {
  const hostData = await loadHostOperations()
  const sourceKind = hostData.source.kind
  const operations = hostData.data.operations
  const receiveCount = operations.filter((item) => item.operation.action === "receive_package").length
  const storageCount = operations.filter((item) => item.operation.action === "assign_storage").length
  const handoffCount = operations.filter((item) => item.operation.action === "complete_handoff").length

  return (
    <DashboardShell title="안녕하세요, 호스트님" subtitle="오늘의 입고, 보관, 픽업 완료 작업을 API 상태 기준으로 처리하세요." active="host">
      <section className="source-banner" data-api-source={sourceKind}>
        <strong>{sourceKind === "api" ? "API 상태: live v1" : "API 상태: demo fallback"}</strong>
        <span>{hostData.source.apiBaseUrl}</span>
        {sourceKind === "demo" ? <span>실제 호스트 작업 성공으로 표시하지 않습니다.</span> : null}
      </section>

      <section className="priority-strip" aria-label="오늘 우선 작업">
        <article className="priority-card">
          <IconMotif index={1} label="" size="md" />
          <div>
            <span>오늘 우선 작업</span>
            <strong>입고 등록</strong>
            <p>{receiveCount}건 대기</p>
          </div>
          <a href="#host-operations">입고 시작</a>
        </article>
        <article className="priority-card">
          <IconMotif index={2} label="" size="md" />
          <div>
            <span>오늘 우선 작업</span>
            <strong>보관함 배정</strong>
            <p>{storageCount}건 대기</p>
          </div>
          <a href="#host-operations">슬롯 배정</a>
        </article>
        <article className="priority-card">
          <IconMotif index={3} label="" size="md" />
          <div>
            <span>오늘 우선 작업</span>
            <strong>픽업 완료</strong>
            <p>{handoffCount}건 대기</p>
          </div>
          <a href="#host-operations">코드 확인</a>
        </article>
      </section>

      <section className="metric-grid metric-grid--four">
        <article className="metric-card" data-noninteractive="host-operation-metric">
          <IconMotif index={1} label="" size="md" />
          <span>작업 대기</span>
          <strong>{operations.length}</strong>
          <p>live/demo source 기준</p>
        </article>
        <article className="metric-card" data-noninteractive="host-operation-metric">
          <IconMotif index={2} label="" size="md" />
          <span>입고 필요</span>
          <strong>{receiveCount}</strong>
          <p>배송기사 도착 확인</p>
        </article>
        <article className="metric-card" data-noninteractive="host-operation-metric">
          <IconMotif index={3} label="" size="md" />
          <span>보관 배정</span>
          <strong>{storageCount}</strong>
          <p>보관함 번호 확인</p>
        </article>
        <article className="metric-card" data-noninteractive="host-operation-metric">
          <IconMotif index={4} label="" size="md" />
          <span>핸드오프</span>
          <strong>{handoffCount}</strong>
          <p>코드 검증 후 완료</p>
        </article>
      </section>

      <section id="host-operations" className="dashboard-grid dashboard-grid--host">
        <article className="panel panel--wide">
          <div className="panel-header">
            <div>
              <h2>호스트 운영 작업</h2>
              <p>입고 등록 → 보관함 배정 → 픽업 완료 순서로만 처리됩니다.</p>
            </div>
            <StatusPill tone={sourceKind === "api" ? "green" : "coral"}>{sourceKind === "api" ? "Live" : "Demo"}</StatusPill>
          </div>
          <HostOperationBoard apiSourceKind={sourceKind} initialOperations={operations} />
        </article>
      </section>
    </DashboardShell>
  )
}
