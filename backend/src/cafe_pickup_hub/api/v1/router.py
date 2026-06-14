from fastapi import APIRouter

from cafe_pickup_hub.api.v1.routes import health, host_operations, hubs, pickup_authorizations, pickup_requests

router = APIRouter(prefix="/api/v1")
router.include_router(health.router)
router.include_router(host_operations.router)
router.include_router(hubs.router)
router.include_router(pickup_authorizations.router)
router.include_router(pickup_requests.router)
