# Cafe Pickup Hub Frontend

Next.js App Router 기반 모바일 우선 UI입니다.

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Backend API 연결

Frontend는 server component data access layer에서 backend Phase 3 API를 읽습니다.

- `GET /api/v1/hubs`
- `GET /api/v1/pickup-requests`
- `POST /api/v1/pickup-requests`
- `GET /api/v1/host/operations`
- `POST /api/v1/host/operations/{pickup_request_id}/actions`

기본 API 주소는 `http://127.0.0.1:8000`입니다. 로컬 backend 포트가 다르면 `NEXT_PUBLIC_API_BASE_URL`을 지정하세요.

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001 npm run dev -- --hostname 127.0.0.1 --port 3002
```

Backend가 없거나 API contract parse가 실패하면 silent success로 숨기지 않고, 화면에 `API 상태: demo fallback`과 이유를 표시합니다. Build는 backend가 없어도 demo fallback으로 완료됩니다. Demo fallback 상태에서는 booking form과 host operation action이 실제 성공처럼 동작하지 않고 버튼이 비활성화됩니다.

Pickup request 생성은 browser에서 backend를 직접 호출하지 않고 same-origin route handler를 통합니다.

- Browser form: `POST /api/pickup-requests`
- Frontend proxy: `POST ${NEXT_PUBLIC_API_BASE_URL}/api/v1/pickup-requests`

Host operation action도 same-origin route handler를 통합니다.

- Browser action: `POST /api/host-operations/{pickupRequestId}/actions`
- Frontend proxy: `POST ${NEXT_PUBLIC_API_BASE_URL}/api/v1/host/operations/{pickup_request_id}/actions`

## Smoke

```bash
npm run smoke:api-contract
ROUTE_SMOKE_BASE_URL=http://127.0.0.1:3002 npm run smoke:api-contract
npm run smoke:routes
```
