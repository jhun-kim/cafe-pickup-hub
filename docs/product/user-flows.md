# User Flows

## 1. Consumer Package Receiving

### Happy path

1. `User`가 현재 위치 또는 검색 위치를 선택합니다.
2. 서비스가 주변 `Hub` 목록을 보여줍니다.
   - 거리, 영업 상태, `StorageSlot` 여유, 일일 보관료, 신뢰 배지를 표시합니다.
3. `User`가 `Hub`를 선택하고 `PickupRequest`를 생성합니다.
   - package size, 예상 도착일, pickup time window, 배송 메모를 입력합니다.
4. `Payment`가 `authorized` 또는 `pending` 상태가 됩니다.
   - MVP vertical slice에서는 `POST /api/v1/pickup-requests`가 `PickupRequest.confirmed`, `Package.expected`, `Payment.authorized` 상태를 생성합니다.
5. `Host`가 물품 도착을 확인하고 `Package.received`와 슬롯 배정을 기록합니다.
6. `Notification`이 `User`에게 pickup ready 상태를 알립니다.
7. `User`가 cafe에서 pickup code를 제시합니다.
8. `Host`가 code와 상태를 확인하고 `PickupRequest.completed`로 전환합니다.
9. `Payment.captured`, `Settlement.pending`, 선택적으로 `Review.created`가 이어집니다.

### Exception flows

- `Payment.failed`: `PickupRequest.payment_failed`로 전환하고 request를 확정하지 않습니다.
- `Package.not_received`: 도착 예정 시간이 지나도 입고되지 않으면 알림과 cancel option을 제공합니다.
- `PickupRequest.expired`: pickup window가 지나면 추가 보관료 또는 admin/host 정책으로 전환합니다.
- `PickupRequest.disputed`: 물품 불일치, code 실패, 분실 신고가 있으면 `IncidentReport.open`을 생성합니다.

## 2. Friend/Family Delegated Pickup Authorization

### Happy path

1. `User`가 준비된 `PickupRequest`에서 “친구에게 픽업 권한 공유”를 선택합니다.
2. 서비스가 `PickupAuthorization`을 생성합니다.
   - 대상자 이름 또는 연락처, 만료 시간, 사용 가능 횟수, request scope를 포함합니다.
3. `AuthorizedPicker`는 제한된 링크 또는 code card를 받습니다.
4. `AuthorizedPicker`가 cafe에서 code를 제시합니다.
5. `Host`는 authorization 상태를 확인합니다.
   - `active`, 같은 `PickupRequest`, 만료 전, 이미 사용되지 않음.
6. `Host`가 수령 완료를 기록하면 `PickupAuthorization.used`와 `PickupRequest.completed`가 함께 기록됩니다.

### Exception flows

- `PickupAuthorization.expired`: 대리 수령자는 수령할 수 없고 `User`에게 재공유 CTA를 제공합니다.
- `PickupAuthorization.revoked`: `User`가 공유를 취소하면 link/code가 즉시 무효화됩니다.
- `AuthorizedPicker` identity mismatch: host는 `IncidentReport.open` 또는 `manual_review_required`로 escalates.
- `PickupRequest.canceled`: 연결된 authorization은 모두 `revoked` 처리됩니다.

## 3. Cafe Host Inbound / Storage / Pickup Completion

### Inbound flow

1. `Host`가 dashboard에서 오늘 도착 예정 `Package`를 확인합니다.
2. courier 또는 사용자가 물품을 맡기면 `Host`가 tracking hint, 외형 메모, 사진 여부를 기록합니다.
3. `StorageSlot`을 선택합니다.
   - 빈 슬롯이면 `reserved` 또는 `occupied`로 전환합니다.
4. `Package`는 `received`가 되고 `PickupRequest.ready_for_pickup`이 됩니다.
5. `Notification`이 `User`에게 발송됩니다.

### Storage flow

1. `Host`는 슬롯별 상태를 봅니다: `available`, `reserved`, `occupied`, `blocked`.
2. 오입고/파손/과대 물품이면 `IncidentReport.open`을 생성합니다.
3. 영업 종료 전 미수령 물품은 overdue queue로 이동합니다.

### Pickup completion flow

1. 수령자가 code 또는 authorization card를 제시합니다.
2. `Host`가 request, package, authorization 상태를 확인합니다.
3. 성공 시 `Package.picked_up`, `PickupRequest.completed`, `StorageSlot.available`로 전환합니다.
4. 실패 시 `pickup_verification_failed` event와 필요 시 `IncidentReport`를 기록합니다.

## 4. Admin Approval / Incident Flow

### Host approval

1. `Host`가 cafe와 사업자 정보를 제출합니다.
2. `Admin`이 documents, operating hours, safety policy, slot capacity를 검토합니다.
3. 승인 시 `Hub.approved`와 `Hub.active`가 됩니다.
4. 보완 필요 시 `Hub.needs_revision`, 거절 시 `Hub.rejected`가 됩니다.
5. 모든 admin action은 `AdminAuditLog`에 actor, target, action, reason으로 기록됩니다.

### Incident handling

1. `User`, `Host`, 또는 system rule이 `IncidentReport.open`을 생성합니다.
2. `Admin`이 package, request, payment, authorization, host notes를 확인합니다.
3. 필요하면 `Payment` capture hold 또는 `Settlement` hold를 설정합니다.
4. 해결 유형을 선택합니다.
   - no_fault, host_fault, user_fault, courier_fault, fraud_suspected.
5. `IncidentReport.resolved` 또는 `escalated`로 전환하고 audit log를 남깁니다.

## User-facing State Dependencies

| Flow moment | Required state |
| --- | --- |
| pickup code 표시 | `PickupRequest.ready_for_pickup` |
| friend authorization 생성 | `PickupRequest.ready_for_pickup` 또는 정책상 `confirmed` 이후 |
| host pickup completion | `Package.received`, valid code 또는 `PickupAuthorization.active` |
| review 작성 | `PickupRequest.completed` |
| settlement 확정 | `Payment.captured`, incident 없음 또는 resolved |
