export type Hub = {
  readonly id: string
  readonly cafeName: string
  readonly neighborhood: string
  readonly walkMinutesFromStation: number
  readonly rating: number
  readonly openUntil: string
  readonly availableSlots: number
  readonly pricePerDayKrw: number
  readonly trustBadges: readonly string[]
  readonly hostNote: string
}

export const hubs = [
  {
    id: "hub-maple-counter",
    cafeName: "Maple Counter Cafe",
    neighborhood: "Seongsu",
    walkMinutesFromStation: 4,
    rating: 4.9,
    openUntil: "22:30",
    availableSlots: 18,
    pricePerDayKrw: 6500,
    trustBadges: ["staff handoff", "CCTV entrance", "sealed shelf"],
    hostNote: "Small-parcel shelf space watched by staff near Seongsu Station.",
  },
  {
    id: "hub-river-locker",
    cafeName: "River Locker Espresso",
    neighborhood: "Hapjeong",
    walkMinutesFromStation: 6,
    rating: 4.8,
    openUntil: "23:00",
    availableSlots: 10,
    pricePerDayKrw: 8200,
    trustBadges: ["numbered cubbies", "late pickup", "staff verified"],
    hostNote: "Evening cubbies for after-work pickup without meeting strangers.",
  },
  {
    id: "hub-garden-window",
    cafeName: "Garden Window Roasters",
    neighborhood: "Yeonnam",
    walkMinutesFromStation: 8,
    rating: 4.7,
    openUntil: "21:30",
    availableSlots: 14,
    pricePerDayKrw: 5900,
    trustBadges: ["quiet pickup zone", "photo receipt", "dry storage"],
    hostNote: "Low-friction weekend handoffs in a calm residential cafe.",
  },
] as const satisfies readonly Hub[]

export const marketplaceStats = {
  activeHubs: hubs.length,
  totalSlots: hubs.reduce((totalSlots, hub) => totalSlots + hub.availableSlots, 0),
  lowestPrice: Math.min(...hubs.map((hub) => hub.pricePerDayKrw)),
} as const
