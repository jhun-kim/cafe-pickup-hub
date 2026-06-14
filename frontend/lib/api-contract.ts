export type ApiDataSource =
  | {
      readonly kind: "api"
      readonly apiBaseUrl: string
    }
  | {
      readonly kind: "demo"
      readonly apiBaseUrl: string
      readonly reason: string
    }

export type ApiResult<T> = {
  readonly data: T
  readonly source: ApiDataSource
}

export type ApiStorageSlot = {
  readonly id: string
  readonly hubId: string
  readonly label: string
  readonly status: "available" | "reserved" | "occupied" | "out_of_service"
  readonly packageSize: string
}

export type ApiHub = {
  readonly id: string
  readonly hostId: string
  readonly cafeName: string
  readonly neighborhood: string
  readonly address: string
  readonly walkMinutesFromStation: number
  readonly rating: number
  readonly openUntil: string
  readonly availableSlots: number
  readonly pricePerDayKrw: number
  readonly trustBadges: readonly string[]
  readonly storageSlots: readonly ApiStorageSlot[]
}

export type ApiPackage = {
  readonly id: string
  readonly pickupRequestId: string
  readonly storageSlotId: string
  readonly status: "expected" | "received" | "picked_up" | "not_received" | "disputed"
  readonly sizeLabel: string
  readonly arrivalNote: string
}

export type ApiPayment = {
  readonly id: string
  readonly pickupRequestId: string
  readonly amountKrw: number
  readonly status: string
}

export type ApiPickupAuthorization = {
  readonly id: string
  readonly pickupRequestId: string
  readonly authorizedPickerName: string
  readonly status: "active" | "used" | "expired" | "revoked"
  readonly codeHint: string
  readonly expiresAt: string
}

export type ApiPickupRequest = {
  readonly id: string
  readonly userId: string
  readonly hubId: string
  readonly status:
    | "draft"
    | "confirmed"
    | "ready_for_pickup"
    | "completed"
    | "canceled"
    | "expired"
    | "disputed"
    | "payment_failed"
  readonly package: ApiPackage
  readonly payment: ApiPayment
  readonly authorizations: readonly ApiPickupAuthorization[]
  readonly pickupCode: string
  readonly pickupWindow: string
}

export type CreatePickupRequestInput = {
  readonly hubId: string
  readonly userId: string
  readonly packageSize: string
  readonly pickupWindow: string
  readonly deliveryNote: string
}

export type ApiHostOperationAction = "receive_package" | "assign_storage" | "complete_handoff"

export type ApiHostOperationSummary = {
  readonly action: ApiHostOperationAction
  readonly label: string
  readonly priority: number
  readonly nextAction: ApiHostOperationAction | null
  readonly safetyNote: string
}

export type ApiHostOperationItem = {
  readonly hub: ApiHub
  readonly pickupRequest: ApiPickupRequest
  readonly operation: ApiHostOperationSummary
}

export type HostOperationActionInput = {
  readonly pickupRequestId: string
  readonly action: ApiHostOperationAction
  readonly storageSlotId?: string
  readonly pickupCode?: string
  readonly note: string
}
