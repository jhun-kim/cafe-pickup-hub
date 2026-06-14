from fastapi.testclient import TestClient

from cafe_pickup_hub.main import app

client = TestClient(app)


def test_create_pickup_request_returns_confirmed_reservation() -> None:
    payload = {
        "hub_id": "hub-maple-counter",
        "user_id": "user-jieun",
        "package_size": "small parcel",
        "pickup_window": "2026-06-14 18:00-20:30",
        "delivery_note": "Leave with cafe staff only",
    }

    response = client.post("/api/v1/pickup-requests", json=payload)

    assert response.status_code == 201
    created = response.json()
    assert created["id"].startswith("pickup-created-")
    assert created["hub_id"] == "hub-maple-counter"
    assert created["status"] == "confirmed"
    assert created["package"]["status"] == "expected"
    assert created["package"]["size_label"] == "small parcel"
    assert created["payment"]["status"] == "authorized"
    assert created["payment"]["amount_krw"] == 6500

    list_response = client.get("/api/v1/pickup-requests")
    assert list_response.status_code == 200
    request_ids = {item["id"] for item in list_response.json()}
    assert created["id"] in request_ids


def test_create_pickup_request_rejects_unknown_hub() -> None:
    payload = {
        "hub_id": "hub-missing",
        "user_id": "user-jieun",
        "package_size": "small parcel",
        "pickup_window": "2026-06-14 18:00-20:30",
        "delivery_note": "Leave with cafe staff only",
    }

    response = client.post("/api/v1/pickup-requests", json=payload)

    assert response.status_code == 404
    assert response.json()["detail"] == "Hub hub-missing not found"
