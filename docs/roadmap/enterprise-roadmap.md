# Enterprise Roadmap

이 roadmap은 Phase 1 문서 구조 이후의 실행 순서를 정의합니다. MVP v2 scope는 Phase 1 product docs가 기준이며, 아래 후속 단계는 현재 구현 범위가 아니라 enterprise 확장 계획입니다.

## Phase 1: Product & Domain Structure

- Goal: product roles, user flows, domain model, roadmap을 하나의 기준 문서 세트로 정리합니다.
- Main outputs: product structure, user flows, domain model, enterprise roadmap, README index.
- Success criteria: UI/UX와 backend 팀이 같은 `User`, `Hub`, `PickupRequest`, `PickupAuthorization`, `IncidentReport` 언어를 사용합니다.

## Phase 2: UI/UX Redesign Handoff

- Goal: Phase 1 flows와 domain states를 기준으로 consumer, delegated pickup, host, admin UI/UX를 재설계합니다.
- Main outputs: route-level wireframes, screen inventory, component hierarchy, interaction states, empty/error/loading state spec.
- Success criteria: `/`, `/pickup-flow`, `/friend-permission`, `/host`, `/admin`이 flow 문서와 state machine을 직접 반영합니다.
- Dependency: Phase 1 docs 승인 후 진행합니다.

## Phase 3: Backend Redesign Handoff

- Goal: domain model을 실제 backend architecture로 전환합니다.
- Main outputs: API contract, persistence model, auth/permission boundary, migration plan, service/module structure.
- Success criteria: `PickupAuthorization`, `StorageSlot`, `IncidentReport`, `Settlement`가 first-class backend resource로 설계됩니다.
- Dependency: Phase 2 UI state needs와 Phase 1 domain model을 함께 반영합니다.

## Phase 4: Trust & Safety Foundation

- Goal: code verification, delegated pickup abuse prevention, incident intake를 운영 가능한 수준으로 만듭니다.
- Main outputs: risk policy, incident taxonomy, verification logs, admin action policy, audit retention policy.
- Success criteria: disputed pickup, expired authorization, host fault, payment hold를 추적하고 설명할 수 있습니다.

## Phase 5: Payment & Settlement

- Goal: 보관료 결제와 host 정산을 enterprise accounting 관점으로 확장합니다.
- Main outputs: payment provider integration plan, settlement ledger, refund/hold policy, payout reconciliation.
- Success criteria: captured payment와 settlement status가 incident hold와 충돌하지 않습니다.

## Phase 6: Host Onboarding & Quality Control

- Goal: cafe partner acquisition과 approval quality를 반복 가능한 workflow로 만듭니다.
- Main outputs: host application, document review, hub readiness checklist, slot capacity validation.
- Success criteria: 신규 `Hub`가 승인 전 안전 기준과 운영 기준을 충족합니다.

## Phase 7: Notification & Lifecycle Automation

- Goal: package lifecycle과 pickup window에 맞춘 notification orchestration을 구현합니다.
- Main outputs: event taxonomy, notification templates, retry policy, channel preference, failure handling.
- Success criteria: received, ready, expiring, overdue, completed, incident events가 누락 없이 전달됩니다.

## Phase 8: Operations Dashboard & Analytics

- Goal: marketplace operator가 hub quality, incident risk, overdue package, onboarding funnel을 모니터링합니다.
- Main outputs: admin KPIs, operational dashboards, SLA views, export/reporting contract.
- Success criteria: 운영자가 어떤 hub와 incident를 먼저 봐야 하는지 한 화면에서 판단할 수 있습니다.

## Phase 9: Scale Architecture

- Goal: 단일 MVP service에서 확장 가능한 service/data boundary로 이동합니다.
- Main outputs: modular service boundary, job/event queue, observability, rate limiting, backup/recovery plan.
- Success criteria: pickup verification, notification, payment, settlement, incident workflow가 독립적으로 확장됩니다.

## Phase 10: Enterprise Partnerships & Compliance

- Goal: B2B partner, 보험, 법무, 개인정보보호, 지역 확장을 지원합니다.
- Main outputs: partner API, compliance evidence, insurance workflow, DPA/privacy controls, enterprise reporting.
- Success criteria: 대형 cafe franchise 또는 logistics partner와 계약 가능한 운영/보안 자료를 제공합니다.
