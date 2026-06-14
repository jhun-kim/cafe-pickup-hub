from fastapi.testclient import TestClient

from cafe_pickup_hub.main import app

client = TestClient(app)


def test_v1_health_reports_domain_resources() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "cafe-pickup-hub-api",
        "api_version": "v1",
        "sample_hubs": 3,
        "sample_pickup_requests": 2,
    }


def test_v1_hubs_expose_slots_and_trust_boundaries() -> None:
    response = client.get("/api/v1/hubs")

    assert response.status_code == 200
    hubs = response.json()
    assert len(hubs) == 3
    assert hubs[0]["id"] == "hub-maple-counter"
    assert hubs[0]["available_slots"] == 18
    assert hubs[0]["storage_slots"][0]["status"] == "available"
    assert "staff handoff" in hubs[0]["trust_badges"]


def test_v1_pickup_requests_expose_package_and_authorization_state() -> None:
    response = client.get("/api/v1/pickup-requests")

    assert response.status_code == 200
    requests = response.json()
    assert len(requests) == 2
    ready_request = requests[0]
    assert ready_request["status"] == "ready_for_pickup"
    assert ready_request["package"]["status"] == "received"
    assert ready_request["authorizations"][0]["status"] == "active"


def test_legacy_hub_endpoints_still_work() -> None:
    health = client.get("/health")
    hubs = client.get("/api/hubs")
    hub = client.get("/api/hubs/hub-river-locker")
    listings = client.get("/api/listings")

    assert health.status_code == 200
    assert hubs.status_code == 200
    assert hub.status_code == 200
    assert listings.status_code == 200
