from typing import NewType

from pydantic import BaseModel, ConfigDict, Field

HubId = NewType("HubId", str)
ListingId = NewType("ListingId", str)


class HubAmenity(BaseModel):
    model_config = ConfigDict(frozen=True)

    label: str
    detail: str


class PickupHub(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: HubId
    cafe_name: str
    neighborhood: str
    address: str
    walk_minutes_from_station: int = Field(ge=0)
    rating: float = Field(ge=0, le=5)
    open_until: str
    available_slots: int = Field(ge=0)
    price_per_day_krw: int = Field(ge=0)
    trust_badges: tuple[str, ...]
    amenities: tuple[HubAmenity, ...]
    host_note: str


class HubListing(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: ListingId
    hub_id: HubId
    title: str
    package_size: str
    storage_type: str
    daily_capacity: int = Field(ge=0)
    cutoff_time: str
    price_per_day_krw: int = Field(ge=0)


class HealthResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    status: str
    service: str
    sample_hubs: int = Field(ge=0)
