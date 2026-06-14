from fastapi.testclient import TestClient

from cafe_pickup_hub.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "cafe-pickup-hub-api",
        "sample_hubs": 3,
    }


def test_list_hubs_exposes_marketplace_fields() -> None:
    response = client.get("/api/hubs")

    assert response.status_code == 200
    hubs = response.json()
    assert len(hubs) == 3
    assert hubs[0]["cafe_name"] == "Maple Counter Cafe"
    assert hubs[0]["available_slots"] == 18
    assert hubs[0]["trust_badges"] == ["staff handoff", "CCTV entrance", "sealed shelf"]


def test_get_hub_and_not_found() -> None:
    found = client.get("/api/hubs/hub-river-locker")
    missing = client.get("/api/hubs/unknown")

    assert found.status_code == 200
    assert found.json()["neighborhood"] == "Hapjeong"
    assert missing.status_code == 404


def test_listings_include_pickup_capacity_and_price() -> None:
    response = client.get("/api/listings")

    assert response.status_code == 200
    listings = response.json()
    assert len(listings) == 3
    assert listings[0]["storage_type"] == "Staff-visible shelf"
    assert listings[0]["price_per_day_krw"] == 6500
