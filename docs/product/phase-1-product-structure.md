# Phase 1 Product Structure

## 서비스 비전

Cafe Pickup Hub는 카페의 남는 선반, 카운터, 보관함을 신뢰 가능한 생활권 픽업 거점으로 전환하는 marketplace입니다. 사용자는 집 앞 배송 불안, 부재중 택배 분실, 중고거래 직접 대면 부담을 줄이고, 카페는 기존 공간을 활용해 보관 수수료와 방문 전환을 얻습니다.

Phase 1의 목적은 기능을 많이 넣는 것이 아니라 enterprise-grade 제품 구조를 먼저 합의하는 것입니다. 이후 UI/UX, backend, payment, operations가 같은 언어로 움직일 수 있도록 role, journey, trust boundary, domain model을 고정합니다.

## 사용자 역할

| Role | 설명 | 핵심 책임 |
| --- | --- | --- |
| `User` | 물품을 받을 소비자 | `Hub` 탐색, `PickupRequest` 생성, 결제, 수령 완료 확인 |
| `AuthorizedPicker` | 친구/가족 등 대리 수령자 | `PickupAuthorization`으로 제한된 픽업 권한 행사 |
| `Host` | 카페 운영자 또는 매장 직원 | `Hub`, `StorageSlot`, 입고, 보관, 수령 인증, 사고 보고 |
| `Admin` | marketplace 운영자 | host 승인, incident 조정, audit, risk policy 운영 |

`AuthorizedPicker`는 별도 계정이 있을 수도 있고 초대 링크 기반 임시 주체일 수도 있습니다. 다만 권한 모델에서는 `User`와 분리해야 합니다. 대리 수령자는 결제, 주소 수정, 환불, host 정산 정보에 접근할 수 없습니다.

## 핵심 제품 구조

### Consumer surface

- 주변 `Hub` 검색: 위치, 영업 상태, 보관 가능 슬롯, 가격, 신뢰 배지를 비교합니다.
- `PickupRequest` 생성: 받을 물품, 배송 메모, 수령 시간 창, 보관 타입을 입력합니다.
- 픽업 준비: 입고 완료 알림, pickup code, QR-like verification token, 수령 안내를 확인합니다.
- 완료/리뷰: 수령 후 `Review`를 남기고 문제가 있으면 `IncidentReport`를 생성합니다.

### Host surface

- `StorageSlot` 운영: 선반/보관함/카운터 슬롯을 등록하고 운영 가능 상태를 관리합니다.
- 입고 처리: `Package` 도착 확인, 사진/메모, 슬롯 배정, `User` 알림 발송을 수행합니다.
- 픽업 인증: code 확인, 대리 수령 권한 확인, 수령 완료 처리, 이상 상황 보고를 수행합니다.
- 정산 확인: 보관 수수료, 월별 `Settlement`, dispute hold를 확인합니다.

### Admin surface

- host onboarding: 사업자/매장 정보 검토, 현장 운영 기준 승인, `Hub` 활성화.
- operations monitoring: overdue package, failed pickup, incident, suspicious authorization 추적.
- policy enforcement: 정산 보류, 임시 비활성화, 사고 조정, audit trail 기록.

## Core journeys

1. `User`가 주변 `Hub`를 고르고 `PickupRequest`를 생성합니다.
2. 배송지가 cafe hub로 지정되고, `Host`가 물품 도착을 `Package.received`로 기록합니다.
3. `User` 또는 `AuthorizedPicker`가 pickup code를 제시합니다.
4. `Host`가 code, 시간 창, authorization 상태를 확인하고 `PickupRequest.completed`를 기록합니다.
5. `Payment`와 `Settlement`가 확정되고 `Review` 또는 `IncidentReport`가 후속으로 연결됩니다.

## MVP v2 In Scope

- Consumer web/mobile-responsive flow: hub 탐색, pickup request 생성, pickup code 확인.
- Friend/family delegated pickup: `PickupAuthorization` 생성, 만료 시간, 제한 권한, 사용 완료.
- Host dashboard: inbound package, slot assignment, pickup verification, basic schedule.
- Admin console draft: host approval, incident queue, audit visibility.
- Deterministic product policy: slot capacity, package state, pickup state, incident state.
- Basic payment/settlement domain 설계: 실제 PG 연동 전 resource boundary와 상태 정의.
- Notification contract: email/SMS/push 중 구현 채널은 나중에 결정하되 event 종류는 정의.

## MVP v2 Out of Scope

- 실시간 courier integration, carrier API 자동 동기화.
- 실제 payment gateway, tax invoice, advanced payout automation.
- 보험/보상 자동 심사, 법무 workflow 자동화.
- Multi-country localization, multi-currency settlement.
- AI fraud scoring, computer vision package verification.
- Native iOS/Android 앱. Phase 2에서는 UI/UX redesign을 하되 implementation target은 별도 결정합니다.
- Warehouse-style inventory system. Cafe Pickup Hub는 cafe-scale pickup hub이며 full logistics WMS가 아닙니다.

## Trust/Safety Principles

1. **최소 권한**: `AuthorizedPicker`는 특정 `PickupRequest`에만 접근합니다.
2. **상태 기반 인증**: pickup code는 `PickupRequest.ready_for_pickup` 이후에만 유효합니다.
3. **Host scope isolation**: `Host`는 자신이 소유하거나 근무하는 `Hub` 데이터만 봅니다.
4. **Audit by default**: admin 조치, incident 조정, payout hold는 `AdminAuditLog`에 기록합니다.
5. **Dispute-ready evidence**: 입고 시간, 슬롯, pickup 인증, actor, incident note를 보존합니다.
6. **Human-operable fallback**: code 실패, 대리 수령 만료, 물품 불일치 시 host/admin escalation이 있어야 합니다.

## Phase 1 Definition of Done

Phase 1은 제품 문서 구조를 확정하는 단계입니다. 성공 기준은 사용자가 보는 UI가 아니라, 다음 단계의 UI/UX redesign과 backend redesign이 같은 domain language와 permission model을 참조할 수 있는 상태입니다.
