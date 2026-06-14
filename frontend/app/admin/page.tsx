import { DashboardShell } from "@/components/uiux/DashboardShell"
import { IconMotif } from "@/components/uiux/IconMotif"
import { StatusPill } from "@/components/uiux/StatusPill"
import { adminMetrics } from "@/lib/uiux-data"

const cafeRows = [
  ["성수 빈 세이프", "검증 완료", "42칸", "정상"],
  ["연남 로스터리", "서류 확인", "18칸", "검토"],
  ["강남 이브닝", "현장 방문", "26칸", "대기"],
  ["합정 리버락커", "검증 완료", "31칸", "정상"],
] as const

export default function AdminPage() {
  return (
    <DashboardShell title="Marketplace operations" subtitle="카페 파트너와 픽업 리스크를 한 화면에서 관리합니다." active="admin">
      <section className="metric-grid metric-grid--four">
        {adminMetrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <IconMotif index={metric.iconIndex} label="" size="md" />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--admin">
        <article className="panel panel--wide">
          <div className="panel-header">
            <h2>카페 검증 맵 / 리스트</h2>
            <button className="primary-button" type="button">파트너 검토</button>
          </div>
          <div className="ops-map">
            <span className="map-pin map-pin--one" />
            <span className="map-pin map-pin--two" />
            <span className="map-pin map-pin--three" />
            <div className="map-card">
              <strong>강남권 집중 검증</strong>
              <p>신규 8개 카페 대기</p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>카페</th><th>검증</th><th>슬롯</th><th>상태</th></tr>
            </thead>
            <tbody>
              {cafeRows.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td><StatusPill tone={row[3] === "정상" ? "green" : "coral"}>{row[3]}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>분쟁 / 연체</h2>
            <StatusPill tone="coral">긴급 2</StatusPill>
          </div>
          <div className="incident-list">
            {["픽업 코드 불일치", "24시간 초과 보관", "파트너 서류 보완"].map((item) => (
              <div key={item}>
                <IconMotif index={3} label="" size="sm" />
                <span>{item}</span>
                <button type="button">처리</button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>온보딩 퍼널</h2>
          </div>
          <div className="funnel">
            <div><span style={{ width: "92%" }} />신청 92</div>
            <div><span style={{ width: "64%" }} />서류 64</div>
            <div><span style={{ width: "41%" }} />현장 41</div>
            <div><span style={{ width: "28%" }} />활성 28</div>
          </div>
        </article>
      </section>
    </DashboardShell>
  )
}
