import type { Hub } from "@/lib/hubs"

type HubCardProps = {
  readonly hub: Hub
}

const formatKrw = new Intl.NumberFormat("ko-KR")

export function HubCard({ hub }: HubCardProps) {
  return (
    <article className="hub-card">
      <div className="hub-card__topline">
        <span>{hub.neighborhood}</span>
        <span>{hub.walkMinutesFromStation} min walk</span>
      </div>
      <div>
        <h3>{hub.cafeName}</h3>
        <p>{hub.hostNote}</p>
      </div>
      <div className="hub-card__badges">
        {hub.trustBadges.map((badge) => (
          <span key={badge}>{badge}</span>
        ))}
      </div>
      <dl className="hub-card__metrics">
        <div>
          <dt>Rating</dt>
          <dd>{hub.rating.toFixed(1)}</dd>
        </div>
        <div>
          <dt>Slots</dt>
          <dd>{hub.availableSlots}</dd>
        </div>
        <div>
          <dt>Until</dt>
          <dd>{hub.openUntil}</dd>
        </div>
      </dl>
      <div className="hub-card__price">
        <span>From</span>
        <strong>{formatKrw.format(hub.pricePerDayKrw)} KRW/day</strong>
      </div>
    </article>
  )
}
