# Domain Model

## Entity Overview

| Entity | 설명 | 주요 관계 |
| --- | --- | --- |
| `User` | 소비자 계정 | many `PickupRequest`, many `Payment`, many `Review` |
| `Host` | 카페 소유자/직원 계정 | many `Hub`; staff role로 제한 가능 |
| `Hub` | 픽업 거점 카페 | belongs to `Host`, has many `StorageSlot`, `Package` |
| `StorageSlot` | 선반/보관함/카운터 슬롯 | belongs to `Hub`, may hold one active `Package` |
| `Package` | 실제 맡겨진 물품 단위 | belongs to `PickupRequest`, assigned to `StorageSlot` |
| `PickupRequest` | 수령 요청 | belongs to `User`, `Hub`; has `Package`, `Payment`, authorizations |
| `PickupAuthorization` | 대리 수령 권한 | belongs to `PickupRequest`, created by `User`, used by `AuthorizedPicker` |
| `Payment` | 보관료 결제 | belongs to `PickupRequest` |
| `Settlement` | host 정산 | aggregates captured `Payment` rows for `Host`/`Hub` |
| `Review` | 수령 후 리뷰 | belongs to `User`, `Hub`, optional `PickupRequest` |
| `IncidentReport` | 사고/분쟁 | references `PickupRequest`, `Package`, `Payment`, `Hub` |
| `Notification` | 알림 이벤트 | references recipient actor and source resource |
| `AdminAuditLog` | 관리자 조치 감사 로그 | references admin actor, action, target resource |

## Relationship Rules

- `Hub`는 하나 이상의 `StorageSlot`을 가져야 active가 될 수 있습니다.
- 하나의 active `Package`는 하나의 `StorageSlot`에만 배정됩니다.
- `PickupRequest`는 하나의 primary `Package`를 갖는 모델에서 시작합니다. 여러 물품 묶음은 later phase에서 `PackageGroup`으로 확장합니다.
- `PickupAuthorization`은 `PickupRequest` 범위를 벗어날 수 없습니다.
- `Payment`는 `PickupRequest`의 보관료 책임을 표현하고, `Settlement`는 host payout 관점의 집계입니다.
- `IncidentReport`가 열리면 연결된 `Payment` capture 또는 `Settlement` release가 hold될 수 있습니다.

## State Machines

### `Hub`

```text
draft -> submitted -> approved -> active
submitted -> needs_revision -> submitted
submitted -> rejected
active -> suspended -> active
active -> closed
```

### `StorageSlot`

```text
available -> reserved -> occupied -> available
available -> blocked -> available
occupied -> incident_hold -> available
```

### `Package`

```text
expected -> received -> stored -> picked_up
expected -> missing
received -> damaged_reported -> incident_hold
stored -> overdue -> incident_hold | picked_up
```

### `PickupRequest`

```text
draft -> confirmed -> ready_for_pickup -> completed
draft -> canceled
confirmed -> payment_failed
ready_for_pickup -> expired -> completed | disputed
ready_for_pickup -> disputed
```

### `PickupAuthorization`

```text
active -> used
active -> expired
active -> revoked
active -> verification_failed -> revoked | active
```

### `Payment`

```text
pending -> authorized -> captured -> settled
pending -> failed
authorized -> canceled
captured -> refunded
captured -> dispute_hold -> captured | refunded
```

### `Settlement`

```text
pending -> calculating -> payable -> paid
payable -> hold -> payable
payable -> failed -> payable
```

### `IncidentReport`

```text
open -> triaged -> investigating -> resolved
open -> rejected
investigating -> escalated
resolved -> reopened
```

## Permissions

| Actor | 허용 | 금지 |
| --- | --- | --- |
| `User` | 본인 `PickupRequest`, `Payment`, `PickupAuthorization`, `Review` 생성/조회 | 다른 사용자의 request, host settlement, admin audit 조회 |
| `AuthorizedPicker` | 지정된 `PickupAuthorization`의 제한 정보 조회, pickup code 제시 | 결제, 환불, 주소 변경, 재공유, 리뷰 작성 |
| `Host` | 자신이 소속된 `Hub`, `StorageSlot`, inbound `Package`, pickup verification 관리 | 다른 host의 hub, user payment details, admin audit 수정 |
| `Admin` | approval, incident, payout hold, moderation, audit 조회 | audit log 삭제, payment provider raw secret 조회 |
| System | state transition automation, notification dispatch | 사용자 동의 없는 권한 확대 |

## API Resource Draft

초기 API는 REST resource로 시작하고 event/webhook은 Phase 3 backend redesign에서 확정합니다.

| Resource | Draft endpoints |
| --- | --- |
| `User` | `GET /api/users/me`, `PATCH /api/users/me` |
| `Hub` | `GET /api/hubs`, `GET /api/hubs/{hubId}`, `POST /api/admin/hubs/{hubId}/approve` |
| `StorageSlot` | `GET /api/host/hubs/{hubId}/slots`, `PATCH /api/host/slots/{slotId}` |
| `Package` | `POST /api/host/packages/receive`, `PATCH /api/host/packages/{packageId}` |
| `PickupRequest` | `POST /api/pickup-requests`, `GET /api/pickup-requests/{requestId}`, `POST /api/host/pickup-requests/{requestId}/complete` |
| `PickupAuthorization` | `POST /api/pickup-requests/{requestId}/authorizations`, `POST /api/authorizations/{authorizationId}/revoke`, `POST /api/host/authorizations/verify` |
| `Payment` | `POST /api/payments`, `GET /api/payments/{paymentId}` |
| `Settlement` | `GET /api/host/settlements`, `POST /api/admin/settlements/{settlementId}/hold` |
| `Review` | `POST /api/reviews`, `GET /api/hubs/{hubId}/reviews` |
| `IncidentReport` | `POST /api/incidents`, `GET /api/admin/incidents`, `PATCH /api/admin/incidents/{incidentId}` |
| `Notification` | `GET /api/notifications`, `POST /api/notifications/{notificationId}/read` |
| `AdminAuditLog` | `GET /api/admin/audit-logs` |

## Data Boundaries

### Consumer-owned data

- profile, contact preference, pickup request content, delegated pickup settings.
- host에게는 pickup operation에 필요한 최소 정보만 노출합니다.

### Host operational data

- hub profile, storage slot status, inbound package notes, pickup completion logs.
- host scope는 `Hub` membership으로 제한합니다.

### Admin/audit data

- approval decisions, incident actions, payout holds, manual overrides.
- `AdminAuditLog`는 append-only로 취급하고 삭제 대신 redaction policy를 둡니다.

### Payment/settlement data

- payment token, authorization, capture, refund, settlement, hold 상태.
- raw payment credentials는 application DB에 저장하지 않습니다.

### Notification data

- delivery channel, event type, recipient, send status, failure reason.
- message content은 최소 보존하고 incident/audit에 필요한 event metadata를 유지합니다.

## Auditability Requirements

- 모든 admin write action은 `AdminAuditLog`를 남깁니다.
- incident 관련 state transition은 actor, reason, previous state, next state를 기록합니다.
- pickup completion은 verifier actor, verification method, timestamp, hub, slot을 보존합니다.
- authorization 사용은 one-time use 여부와 만료/취소 이력을 보존합니다.
