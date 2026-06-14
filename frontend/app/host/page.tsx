import { DashboardShell } from "@/components/uiux/DashboardShell"
import { IconMotif } from "@/components/uiux/IconMotif"
import { StatusPill } from "@/components/uiux/StatusPill"
import { hostMetrics } from "@/lib/uiux-data"

const shelfSlots = ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "201", "202", "203", "204", "205"]
const pickupRows = [
  ["13:30", "101번", "김민지", "예정"],
  ["14:00", "204번", "최현우", "예정"],
  ["16:30", "C3번", "박지훈", "확인 필요"],
  ["18:00", "107번", "정유진", "예정"],
] as const

export default function HostPage() {
  return (
    <DashboardShell title="안녕하세요, 모카우드 카페님" subtitle="오늘의 픽업허브 운영 현황을 확인하세요." active="host">
      <section className="metric-grid metric-grid--five">
        {hostMetrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <IconMotif index={metric.iconIndex} label="" size="md" />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel panel--wide">
          <div className="panel-header">
            <h2>보관함 사용 현황</h2>
            <button className="ghost-button" type="button">보관함 설정</button>
          </div>
          <div className="slot-grid">
            {shelfSlots.map((slot, index) => (
              <div key={slot} className={index % 5 === 2 ? "slot-cell is-reserved" : index % 4 === 0 ? "slot-cell is-empty" : "slot-cell is-used"}>
                <span>{slot}</span>
                <IconMotif index={index % 5 === 2 ? 3 : 2} label="" size="sm" />
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>픽업 인증 대기</h2>
            <StatusPill tone="coral">3건</StatusPill>
          </div>
          <div className="verify-list">
            {["A102", "B207", "C3"].map((code, index) => (
              <div key={code} className="verify-row">
                <strong>{code}</strong>
                <span>{index === 1 ? "확인 필요" : "고객 도착"}</span>
                <button type="button">픽업 인증</button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel--wide">
          <div className="panel-header">
            <h2>예정된 픽업 일정</h2>
            <button className="ghost-button" type="button">전체 일정 보기</button>
          </div>
          <table>
            <thead>
              <tr><th>시간</th><th>보관함</th><th>고객명</th><th>상태</th></tr>
            </thead>
            <tbody>
              {pickupRows.map((row) => (
                <tr key={`${row[0]}-${row[1]}`}>
                  <td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </DashboardShell>
  )
}
