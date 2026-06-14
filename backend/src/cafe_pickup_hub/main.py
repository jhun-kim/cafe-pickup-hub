from fastapi import FastAPI

from cafe_pickup_hub.api import legacy_router
from cafe_pickup_hub.api.v1 import router as v1_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Cafe Pickup Hub API",
        summary="Marketplace API for cafes renting spare pickup space.",
        version="0.1.0",
    )

    app.include_router(legacy_router)
    app.include_router(v1_router)
    return app


app = create_app()
