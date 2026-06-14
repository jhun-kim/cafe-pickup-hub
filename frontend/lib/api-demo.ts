import type { ApiHostOperationItem, ApiHub, ApiPickupRequest, ApiResult } from "@/lib/api-contract"
import type { FriendAuthorizationContracts, HostOperationContracts, PickupContracts } from "@/lib/api-client"
import { cafeSpots, flowSteps } from "@/lib/uiux-data"

export function demoContracts(apiBaseUrl: string, reason: string): ApiResult<PickupContracts> {
  const pickupRequests = demoPickupRequests()
  return {
    data: {
      hubs: cafeSpots.map(toDemoHub),
      pickupRequests,
    },
    source: { kind: "demo", apiBaseUrl, reason },
  }
}

export function demoHostOperations(apiBaseUrl: string, reason: string): ApiResult<HostOperationContracts> {
  const hubs = cafeSpots.map(toDemoHub)
  const pickupRequests = demoPickupRequests()
  const firstHub = hubs[0]
  const firstPickup = pickupRequests[0]

  if (!firstHub || !firstPickup) {
    return { data: { operations: [] }, source: { kind: "demo", apiBaseUrl, reason } }
  }

  const operations: readonly ApiHostOperationItem[] = [
    {
      hub: firstHub,
      pickupRequest: firstPickup,
      operation: {
        action: "complete_handoff",
        label: "픽업 완료",
        priority: 3,
        nextAction: null,
        safetyNote: "Demo fallback에서는 실제 픽업 완료 처리를 실행하지 않습니다.",
      },
    },
  ]

  return { data: { operations }, source: { kind: "demo", apiBaseUrl, reason } }
}

export function demoFriendAuthorizations(apiBaseUrl: string, reason: string): ApiResult<FriendAuthorizationContracts> {
  const pickupRequest = demoPickupRequests()[0]
  if (!pickupRequest) {
    return { data: { pickupRequest: null, authorizations: [] }, source: { kind: "demo", apiBaseUrl, reason } }
  }
  return {
    data: {
      pickupRequest: { ...pickupRequest, authorizations: [] },
      authorizations: [],
    },
    source: { kind: "demo", apiBaseUrl, reason },
  }
}

function demoPickupRequests(): readonly ApiPickupRequest[] {
  return [
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
  ]
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
