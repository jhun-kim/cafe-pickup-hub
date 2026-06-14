# Cafe Pickup Hub

Cafe Pickup Hub는 카페와 동네 소상공인의 유휴 공간을 안전한 택배·중고거래 물품 픽업 허브로 대여하는 MVP입니다. 에어비앤비가 숙소를 공유하듯, 이 서비스는 신뢰 가능한 오프라인 공간을 수령 거점으로 공유합니다.

## 핵심 아이디어

- 사용자는 낮 시간 부재 중 분실 위험이 있는 택배나 중고거래 물품의 수령지를 단골 카페로 설정합니다.
- 카페 사장님은 보관 수수료와 방문객 유입 효과를 얻습니다.
- 사용자는 퇴근길에 안전하게 물품을 찾고, 커피 구매로 카페와 상생합니다.
- 친구·가족에게 픽업 권한을 공유할 수 있는 구조를 전제로 합니다.

## 폴더 구조

```text
backend/   uv + FastAPI API 서버
frontend/  Next.js App Router + TypeScript 웹 UI
docs/      제품 구조, 사용자 흐름, 도메인 모델, 로드맵 문서
```

## Phase 1 Enterprise Docs

- [제품 구조](docs/product/phase-1-product-structure.md)
- [사용자 흐름](docs/product/user-flows.md)
- [도메인 모델](docs/architecture/domain-model.md)
- [Enterprise roadmap](docs/roadmap/enterprise-roadmap.md)

## Backend 실행

```bash
cd backend
uv sync
uv run fastapi dev src/cafe_pickup_hub/main.py
uv run pytest -q
```

주요 API:

- `GET /api/v1/health` v1 서비스 상태와 sample domain resource 수
- `GET /api/v1/hubs` storage slot과 trust badge를 포함한 v1 허브 목록
- `GET /api/v1/pickup-requests` package, payment, authorization 상태를 포함한 수령 요청 목록
- `POST /api/v1/pickup-requests` pickup request 예약 생성
- `GET /api/v1/pickup-authorizations` friend/delegate pickup authorization 목록
- `POST /api/v1/pickup-authorizations` 1회용 친구 픽업 권한 생성
- `POST /api/v1/pickup-authorizations/{authorization_id}/revoke` 권한 취소
- `POST /api/v1/pickup-authorizations/{authorization_id}/consume` 1회용 코드 사용
- `GET /api/v1/host/operations` host receive/store/handoff 작업 목록
- `POST /api/v1/host/operations/{pickup_request_id}/actions` 입고 등록, 보관함 배정, 픽업 완료 action
- `GET /health` 서비스 상태
- `GET /api/hubs` 픽업 허브 목록
- `GET /api/hubs/{hub_id}` 픽업 허브 상세
- `GET /api/listings` legacy listing 목록

Backend Phase 3 구조:

- `backend/src/cafe_pickup_hub/domain/` 도메인 후보 모델과 상태 전환 helper
- `backend/src/cafe_pickup_hub/schemas/` API response schema
- `backend/src/cafe_pickup_hub/services/` MVP in-memory service data
- `backend/src/cafe_pickup_hub/api/v1/` versioned FastAPI router

## Frontend 실행

```bash
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

개발 중 백엔드 주소를 바꾸려면 `NEXT_PUBLIC_API_BASE_URL`을 설정하세요. 기본값은 `http://127.0.0.1:8000`입니다.

Backend + Frontend API contract 로컬 실행:

```bash
cd backend
uv run fastapi dev src/cafe_pickup_hub/main.py --host 127.0.0.1 --port 8001

cd frontend
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001 NEXT_PUBLIC_FRONTEND_BASE_URL=http://127.0.0.1:3002 npm run dev -- --hostname 127.0.0.1 --port 3002
API_CONTRACT_EXPECT_SOURCE=api ROUTE_SMOKE_BASE_URL=http://127.0.0.1:3002 npm run smoke:api-contract
```

Backend가 꺼져 있거나 `/api/v1` contract parsing에 실패하면 frontend는 demo fallback을 사용하되, 화면에 `API 상태: demo fallback`과 이유를 표시합니다.
Demo fallback 상태에서는 실제 예약, host operation, friend authorization 성공을 표시하지 않고 action button을 차단합니다.

## MVP 수익/운영 가정

- 카페는 보관 슬롯 단위로 일일 수용량을 관리합니다.
- 사용자는 소형/중형/대형 물품 허용 여부와 운영 시간을 보고 허브를 선택합니다.
- 초기 수익 모델은 보관 수수료와 픽업 방문 전환 효과입니다.
