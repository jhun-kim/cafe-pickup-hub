import type { ApiHub, ApiPickupRequest, ApiResult } from "@/lib/api-contract"
import type { PickupContracts } from "@/lib/api-client"
import { cafeSpots, flowSteps } from "@/lib/uiux-data"

export function demoContracts(apiBaseUrl: string, reason: string): ApiResult<PickupContracts> {
  return {
    data: {
      hubs: cafeSpots.map(toDemoHub),
      pickupRequests: [
        {
          id: "demo-pickup-ready",
          userId: "demo-user",
          hubId: "demo-hub-1",
          status: "ready_for_pickup",
          package: {
            id: "demo-package",
            pickupRequestId: "demo-pickup-ready",
            storageSlotId: "demo-slot-1",
            status: "received",
            sizeLabel: "small parcel",
            arrivalNote: flowSteps[2]?.detailMeta ?? "직원 확인",
          },
          payment: {
            id: "demo-payment",
            pickupRequestId: "demo-pickup-ready",
            amountKrw: 1800,
            status: "captured",
          },
          authorizations: [
            {
              id: "demo-auth",
              pickupRequestId: "demo-pickup-ready",
              authorizedPickerName: "민지",
              status: "active",
              codeHint: "739***",
              expiresAt: "오늘 20:30",
            },
          ],
          pickupCode: "482913",
          pickupWindow: "오늘 18:00-20:30",
        },
      ],
    },
    source: { kind: "demo", apiBaseUrl, reason },
  }
}

function toDemoHub(spot: (typeof cafeSpots)[number], index: number): ApiHub {
  return {
    id: `demo-hub-${index + 1}`,
    hostId: `demo-host-${index + 1}`,
    cafeName: spot.name,
    neighborhood: spot.station,
    address: spot.station,
    walkMinutesFromStation: index + 3,
    rating: 4.7,
    openUntil: "22:00",
    availableSlots: parseAvailableSlots(spot.slots),
    pricePerDayKrw: parseKrw(spot.fee),
    trustBadges: [spot.trust],
    storageSlots: [
      {
        id: `demo-slot-${index + 1}`,
        hubId: `demo-hub-${index + 1}`,
        label: `D${index + 101}`,
        status: index === 2 ? "reserved" : "available",
        packageSize: "small",
      },
    ],
  }
}

function parseAvailableSlots(value: string): number {
  const digits = value.match(/\d+/u)
  return digits ? Number(digits[0]) : 0
}

function parseKrw(value: string): number {
  return Number(value.replace(/[^\d]/gu, ""))
}

export type DemoPickupRequest = ApiPickupRequest
