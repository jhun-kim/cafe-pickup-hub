# Cafe Pickup Hub Backend

uv 기반 FastAPI 백엔드입니다.

```bash
uv sync
uv run fastapi dev src/cafe_pickup_hub/main.py
uv run pytest -q
```

## API 구조

Phase 3부터 backend는 legacy MVP endpoint와 versioned domain API를 함께 제공합니다.

```text
src/cafe_pickup_hub/
  domain/      Pydantic domain candidates, enums, state transition helpers
  schemas/     API response schemas
  services/    in-memory sample data access
  api/v1/      /api/v1 router namespace
```

Versioned endpoints:

- `GET /api/v1/health`
- `GET /api/v1/hubs`
- `GET /api/v1/pickup-requests`

Backward-compatible legacy endpoints:

- `GET /health`
- `GET /api/hubs`
- `GET /api/hubs/{hub_id}`
- `GET /api/listings`

## Frontend contract smoke

Frontend Phase 4는 `/api/v1/hubs`와 `/api/v1/pickup-requests`를 읽습니다.

```bash
uv run fastapi dev src/cafe_pickup_hub/main.py --host 127.0.0.1 --port 8001

cd ../frontend
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001 npm run dev -- --hostname 127.0.0.1 --port 3002
API_CONTRACT_EXPECT_SOURCE=api ROUTE_SMOKE_BASE_URL=http://127.0.0.1:3002 npm run smoke:api-contract
```
