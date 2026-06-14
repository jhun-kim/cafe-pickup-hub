type IconMotifProps = {
  readonly index: 0 | 1 | 2 | 3 | 4 | 5
  readonly label: string
  readonly size?: "sm" | "md" | "lg"
}

const positions = {
  0: "0% 0%",
  1: "50% 0%",
  2: "100% 0%",
  3: "0% 100%",
  4: "50% 100%",
  5: "100% 100%",
} as const

export function IconMotif({ index, label, size = "md" }: IconMotifProps) {
  return (
    <span
      className={`motif motif--${size}`}
      style={{ backgroundPosition: positions[index] }}
      role="img"
      aria-label={label}
    />
  )
}
