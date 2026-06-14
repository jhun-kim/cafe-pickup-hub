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
    <DashboardShell title="Marketplace operations" subtitle="incident, risk hold, audit trail을 live API 기준으로 판단합니다." active="admin">
      <section className="source-banner" data-api-source={sourceKind}>
        <strong>{sourceKind === "api" ? "API 상태: live v1" : "API 상태: demo fallback"}</strong>
        <span>{trustData.source.apiBaseUrl}</span>
        {sourceKind === "demo" ? <span>실제 관리자 조치 성공으로 표시하지 않습니다.</span> : null}
      </section>

      <section className="triage-strip" aria-label="승인 리스크 분쟁 판단">
        <article className="triage-card" data-noninteractive="admin-summary-card">
          <div>
            <StatusPill tone="coral">Incident</StatusPill>
            <strong>{summary.openIncidents}건 열림</strong>
          </div>
          <a href="#admin-trust-board">분쟁 처리</a>
        </article>
        <article className="triage-card" data-noninteractive="admin-summary-card">
          <div>
            <StatusPill tone={summary.highRiskItems > 0 ? "coral" : "green"}>Risk hold</StatusPill>
            <strong>{summary.highRiskItems}건 high risk</strong>
          </div>
          <a href="#admin-trust-board">보류 검토</a>
        </article>
        <article className="triage-card" data-noninteractive="admin-summary-card">
          <div>
            <StatusPill tone="green">Audit</StatusPill>
            <strong>{summary.auditEvents}개 이벤트</strong>
          </div>
          <a href="#audit-log">감사 로그</a>
        </article>
      </section>

      <section className="metric-grid metric-grid--four">
        <article className="metric-card" data-noninteractive="metric-summary">
          <IconMotif index={3} label="" size="md" />
          <span>열린 incident</span>
          <strong>{summary.openIncidents}</strong>
          <p>operator 판단 대기</p>
        </article>
        <article className="metric-card" data-noninteractive="metric-summary">
          <IconMotif index={4} label="" size="md" />
          <span>high risk</span>
          <strong>{summary.highRiskItems}</strong>
          <p>결제/정산 보류 우선</p>
        </article>
        <article className="metric-card" data-noninteractive="metric-summary">
          <IconMotif index={5} label="" size="md" />
          <span>audit trail</span>
          <strong>{summary.auditEvents}</strong>
          <p>모든 판단 기록</p>
        </article>
        <article className="metric-card" data-noninteractive="metric-summary">
          <IconMotif index={2} label="" size="md" />
          <span>우선 처리</span>
          <strong>{firstHighRisk?.incident.id ?? "대기 없음"}</strong>
          <p>{firstHighRisk?.risk.signal ?? "리스크 큐가 비어 있습니다."}</p>
        </article>
      </section>

      <section id="admin-trust-board" className="dashboard-grid dashboard-grid--admin">
        <article className="panel panel--wide">
          <div className="panel-header">
            <div>
              <h2>분쟁 / 리스크 판단</h2>
              <p>incident 상태 전환과 audit log 기록을 같은 action에서 처리합니다.</p>
            </div>
            <StatusPill tone={sourceKind === "api" ? "green" : "coral"}>{sourceKind === "api" ? "Live" : "Demo"}</StatusPill>
          </div>
          <AdminTrustBoard apiSourceKind={sourceKind} initialItems={items} />
        </article>

        <article id="audit-log" className="panel">
          <div className="panel-header">
            <h2>Audit log</h2>
            <StatusPill tone="green">{String(auditLogs.length)}</StatusPill>
          </div>
          <div className="audit-list">
            {auditLogs.slice(-4).map((log) => (
              <div key={log.id} data-noninteractive="audit-log-row">
                <strong>{log.action}</strong>
                <span>{log.entityType} · {log.entityId}</span>
                <p>{log.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardShell>
  )
}
