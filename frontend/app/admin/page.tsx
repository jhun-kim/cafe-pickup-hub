import { AdminTrustBoard } from "@/components/admin/AdminTrustBoard"
import { DashboardShell } from "@/components/uiux/DashboardShell"
import { IconMotif } from "@/components/uiux/IconMotif"
import { StatusPill } from "@/components/uiux/StatusPill"
import { loadAdminTrustFromSameOrigin } from "@/lib/admin-trust-route-data"

export default async function AdminPage() {
  const trustData = await loadAdminTrustFromSameOrigin()
  const sourceKind = trustData.source.kind
  const { auditLogs, items, summary } = trustData.data
  const firstHighRisk = items.find((item) => item.risk.level === "high") ?? items[0] ?? null

  return (
    <DashboardShell title="운영 리스크 관리" subtitle="분쟁, 보류, 감사 기록을 서버 데이터 기준으로 판단합니다." active="admin">
      <section className="source-banner" data-api-source={sourceKind}>
        <strong>{sourceKind === "api" ? "서버 연결됨" : "데모 데이터 표시 중"}</strong>
        <span>{trustData.source.apiBaseUrl}</span>
        {sourceKind === "demo" ? <span>실제 관리자 조치 성공으로 표시하지 않습니다.</span> : null}
      </section>

      <section className="triage-strip" aria-label="승인 리스크 분쟁 판단">
        <article className="triage-card" data-noninteractive="admin-summary-card">
          <div>
            <StatusPill tone="coral">분쟁</StatusPill>
            <strong>{summary.openIncidents}건 열림</strong>
          </div>
          <a href="#admin-trust-board">분쟁 처리</a>
        </article>
        <article className="triage-card" data-noninteractive="admin-summary-card">
          <div>
            <StatusPill tone={summary.highRiskItems > 0 ? "coral" : "green"}>보류</StatusPill>
            <strong>{summary.highRiskItems}건 고위험</strong>
          </div>
          <a href="#admin-trust-board">보류 검토</a>
        </article>
        <article className="triage-card" data-noninteractive="admin-summary-card">
          <div>
            <StatusPill tone="green">감사</StatusPill>
            <strong>{summary.auditEvents}개 이벤트</strong>
          </div>
          <a href="#audit-log">감사 로그</a>
        </article>
      </section>

      <section className="metric-grid metric-grid--four">
        <article className="metric-card" data-noninteractive="metric-summary">
          <IconMotif index={3} label="" size="md" />
          <span>열린 분쟁</span>
          <strong>{summary.openIncidents}</strong>
          <p>운영자 판단 대기</p>
        </article>
        <article className="metric-card" data-noninteractive="metric-summary">
          <IconMotif index={4} label="" size="md" />
          <span>고위험</span>
          <strong>{summary.highRiskItems}</strong>
          <p>결제/정산 보류 우선</p>
        </article>
        <article className="metric-card" data-noninteractive="metric-summary">
          <IconMotif index={5} label="" size="md" />
          <span>감사 기록</span>
          <strong>{summary.auditEvents}</strong>
          <p>모든 판단 기록</p>
        </article>
        <article className="metric-card" data-noninteractive="metric-summary">
          <IconMotif index={2} label="" size="md" />
          <span>우선 처리</span>
          <strong>{firstHighRisk?.incident.id ?? "대기 없음"}</strong>
          <p>{firstHighRisk ? riskSignalLabel(firstHighRisk.risk.signal) : "리스크 큐가 비어 있습니다."}</p>
        </article>
      </section>

      <section id="admin-trust-board" className="dashboard-grid dashboard-grid--admin">
        <article className="panel panel--wide">
          <div className="panel-header">
            <div>
              <h2>분쟁 / 리스크 판단</h2>
              <p>분쟁 상태 전환과 감사 기록을 한 번의 조치로 처리합니다.</p>
            </div>
            <StatusPill tone={sourceKind === "api" ? "green" : "coral"}>{sourceKind === "api" ? "실시간" : "데모"}</StatusPill>
          </div>
          <AdminTrustBoard apiSourceKind={sourceKind} initialItems={items} />
        </article>

        <article id="audit-log" className="panel">
          <div className="panel-header">
            <h2>감사 기록</h2>
            <StatusPill tone="green">{String(auditLogs.length)}</StatusPill>
          </div>
          <div className="audit-list">
            {auditLogs.slice(-4).map((log) => (
              <div key={log.id} data-noninteractive="audit-log-row">
                <strong>{auditActionLabel(log.action)}</strong>
                <span>{auditEntityLabel(log.entityType)} · {log.entityId}</span>
                <p>{auditNoteLabel(log.note)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  )
}

function riskSignalLabel(value: string): string {
  const labels: Record<string, string> = {
    "Demo package is past pickup window": "장기 보관 확인",
    "Demo risk signal; no real hold is applied": "수령 코드 확인 필요",
    "package stored past pickup window": "택배가 픽업 시간 이후에도 보관 중",
    "wrong code retry plus active friend authorization": "잘못된 코드 재시도와 활성 친구 권한이 함께 감지됨",
  }
  return labels[value] ?? value
}

function auditActionLabel(value: string): string {
  const labels: Record<string, string> = {
    demo_hold_applied: "연결 확인용 기록",
    demo_review_created: "연결 확인용 검토",
    incident_created: "분쟁 생성",
    settlement_hold: "정산 보류",
  }
  return labels[value] ?? value
}

function auditEntityLabel(value: string): string {
  const labels: Record<string, string> = {
    IncidentReport: "분쟁",
    RiskRecord: "리스크",
  }
  return labels[value] ?? value
}

function auditNoteLabel(value: string): string {
  const labels: Record<string, string> = {
    "Demo fallback only; operator actions are disabled.": "데모 데이터이므로 운영자 조치는 비활성화됩니다.",
    "Displayed as non-production trust data.": "실서비스가 아닌 신뢰도 데모 데이터로 표시됩니다.",
    "settlement hold applied while admin reviews evidence": "운영자가 증빙을 검토하는 동안 정산을 보류했습니다.",
    "system opened trust review from pickup verification failure": "픽업 인증 실패로 신뢰 검토가 열렸습니다.",
  }
  return labels[value] ?? value
}
