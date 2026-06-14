from dataclasses import dataclass

from cafe_pickup_hub.domain.models import Hub
from cafe_pickup_hub.services.sample_data import SAMPLE_HUBS_V1


@dataclass(frozen=True, slots=True)
class CatalogService:
    hubs: tuple[Hub, ...]

    def list_hubs(self) -> tuple[Hub, ...]:
        return self.hubs


def get_catalog_service() -> CatalogService:
    return CatalogService(hubs=SAMPLE_HUBS_V1)
