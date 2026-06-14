from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from cafe_pickup_hub.main import app

client = TestClient(app)


def future_expiry() -> str:
    return (datetime.now().astimezone() + timedelta(hours=8)).isoformat()


def past_expiry() -> str:
    return (datetime.now().astimezone() - timedelta(minutes=5)).isoformat()


def create_ready_pickup_request() -> str:
    create_response = client.post(
        "/api/v1/pickup-requests",
        json={
            "hub_id": "hub-maple-counter",
            "user_id": "user-jieun",
            "package_size": "small parcel",
            "pickup_window": "2026-06-14 18:00-20:30",
            "delivery_note": "Friend authorization test package",
        },
    )
    assert create_response.status_code == 201
    pickup_request_id = create_response.json()["id"]

    receive_response = client.post(
        f"/api/v1/host/operations/{pickup_request_id}/actions",
        json={"action": "receive_package", "storage_slot_id": "slot-maple-a101", "note": "Received for friend auth test"},
    )
    assert receive_response.status_code == 200

    assign_response = client.post(
        f"/api/v1/host/operations/{pickup_request_id}/actions",
        json={"action": "assign_storage", "storage_slot_id": "slot-maple-a101", "note": "Ready for friend auth test"},
    )
    assert assign_response.status_code == 200
    return pickup_request_id


def create_authorization(pickup_request_id: str, picker_name: str = "Minji Lee") -> dict[str, str]:
    response = client.post(
        "/api/v1/pickup-authorizations",
        json={
            "pickup_request_id": pickup_request_id,
            "authorized_picker_name": picker_name,
            "expires_at": future_expiry(),
        },
    )

    assert response.status_code == 201
    return response.json()


def test_friend_authorization_create_list_revoke_and_consume() -> None:
    pickup_request_id = create_ready_pickup_request()

    created = create_authorization(pickup_request_id)

    assert created["id"].startswith("auth-created-")
    assert created["pickup_request_id"] == pickup_request_id
    assert created["authorized_picker_name"] == "Minji Lee"
    assert created["status"] == "active"
    assert created["code_hint"].endswith("***")
    assert "one_time_code" in created

    list_response = client.get(f"/api/v1/pickup-authorizations?pickup_request_id={pickup_request_id}")
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [created["id"]]

    revoke_response = client.post(f"/api/v1/pickup-authorizations/{created['id']}/revoke")
    assert revoke_response.status_code == 200
    assert revoke_response.json()["status"] == "revoked"

    second = create_authorization(pickup_request_id, picker_name="Joon Park")
    consume_response = client.post(
        f"/api/v1/pickup-authorizations/{second['id']}/consume",
        json={"one_time_code": second["one_time_code"]},
    )

    assert consume_response.status_code == 200
    assert consume_response.json()["status"] == "used"


def test_friend_authorization_rejects_wrong_used_revoked_and_expired_codes() -> None:
    pickup_request_id = create_ready_pickup_request()

    wrong_code_auth = create_authorization(pickup_request_id, picker_name="Wrong Code")
    wrong_code_response = client.post(
        f"/api/v1/pickup-authorizations/{wrong_code_auth['id']}/consume",
        json={"one_time_code": "000000"},
    )
    assert wrong_code_response.status_code == 403
    assert "code" in wrong_code_response.json()["detail"].lower()

    used_auth = create_authorization(pickup_request_id, picker_name="Already Used")
    first_consume = client.post(
        f"/api/v1/pickup-authorizations/{used_auth['id']}/consume",
        json={"one_time_code": used_auth["one_time_code"]},
    )
    second_consume = client.post(
        f"/api/v1/pickup-authorizations/{used_auth['id']}/consume",
        json={"one_time_code": used_auth["one_time_code"]},
    )
    assert first_consume.status_code == 200
    assert second_consume.status_code == 409
    assert "used" in second_consume.json()["detail"].lower()

    revoked_auth = create_authorization(pickup_request_id, picker_name="Revoked")
    revoke_response = client.post(f"/api/v1/pickup-authorizations/{revoked_auth['id']}/revoke")
    revoked_consume = client.post(
        f"/api/v1/pickup-authorizations/{revoked_auth['id']}/consume",
        json={"one_time_code": revoked_auth["one_time_code"]},
    )
    assert revoke_response.status_code == 200
    assert revoked_consume.status_code == 409
    assert "revoked" in revoked_consume.json()["detail"].lower()

    expired_response = client.post(
        "/api/v1/pickup-authorizations",
        json={
            "pickup_request_id": pickup_request_id,
            "authorized_picker_name": "Expired",
            "expires_at": past_expiry(),
        },
    )
    expired_auth = expired_response.json()
    expired_consume = client.post(
        f"/api/v1/pickup-authorizations/{expired_auth['id']}/consume",
        json={"one_time_code": expired_auth["one_time_code"]},
    )
    assert expired_consume.status_code == 409
    assert "expired" in expired_consume.json()["detail"].lower()
