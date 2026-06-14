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
- `POST /api/v1/pickup-requests`
- `GET /api/v1/pickup-authorizations`
- `POST /api/v1/pickup-authorizations`
- `POST /api/v1/pickup-authorizations/{authorization_id}/revoke`
- `POST /api/v1/pickup-authorizations/{authorization_id}/consume`
- `GET /api/v1/host/operations`
- `POST /api/v1/host/operations/{pickup_request_id}/actions`
- `GET /api/v1/admin/trust`
- `POST /api/v1/admin/trust/incidents/{incident_id}/actions`

Backward-compatible legacy endpoints:

- `GET /health`
- `GET /api/hubs`
- `GET /api/hubs/{hub_id}`
- `GET /api/listings`

## Frontend contract smoke

Frontend Phase 4는 `/api/v1/hubs`와 `/api/v1/pickup-requests`를 읽습니다.
Phase 5부터는 same-origin frontend proxy가 pickup request 생성을 backend로 전달합니다.

```bash
uv run fastapi dev src/cafe_pickup_hub/main.py --host 127.0.0.1 --port 8001

cd ../frontend
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001 npm run dev -- --hostname 127.0.0.1 --port 3002
API_CONTRACT_EXPECT_SOURCE=api ROUTE_SMOKE_BASE_URL=http://127.0.0.1:3002 npm run smoke:api-contract
```

Backend 직접 create smoke:

```bash
curl -i -X POST http://127.0.0.1:8001/api/v1/pickup-requests \
  -H 'content-type: application/json' \
  -d '{"hub_id":"hub-maple-counter","user_id":"user-jieun","package_size":"small parcel","pickup_window":"2026-06-14 18:00-20:30","delivery_note":"Leave with cafe staff only"}'
```

Backend 직접 host operation smoke:

```bash
curl -i -X POST http://127.0.0.1:8001/api/v1/host/operations/pickup-confirmed-002/actions \
  -H 'content-type: application/json' \
  -d '{"action":"receive_package","storage_slot_id":"slot-river-b201","note":"Courier seal checked"}'
```

Backend 직접 friend authorization smoke:

```bash
curl -i -X POST http://127.0.0.1:8001/api/v1/pickup-authorizations \
  -H 'content-type: application/json' \
  -d '{"pickup_request_id":"pickup-ready-001","authorized_picker_name":"Minji Lee","expires_at":"2026-06-14T20:30:00+09:00"}'
```

Backend 직접 admin trust action smoke:

```bash
curl -i -X POST http://127.0.0.1:8001/api/v1/admin/trust/incidents/incident-code-mismatch/actions \
  -H 'content-type: application/json' \
  -d '{"action":"start_review","admin_user_id":"admin-ops-1","note":"Manual trust review started"}'
```
