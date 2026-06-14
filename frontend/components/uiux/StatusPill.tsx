type StatusPillProps = {
  readonly children: string
  readonly tone?: "green" | "coral" | "neutral"
}

export function StatusPill({ children, tone = "neutral" }: StatusPillProps) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>
}
