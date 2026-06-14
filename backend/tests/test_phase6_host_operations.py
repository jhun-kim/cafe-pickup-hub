from fastapi.testclient import TestClient

from cafe_pickup_hub.main import app

client = TestClient(app)


def test_host_operations_progress_receive_store_and_handoff() -> None:
    receive_response = client.post(
        "/api/v1/host/operations/pickup-confirmed-002/actions",
        json={"action": "receive_package", "storage_slot_id": "slot-river-b201", "note": "Courier seal checked"},
    )

    assert receive_response.status_code == 200
    received = receive_response.json()["pickup_request"]
    assert received["id"] == "pickup-confirmed-002"
    assert received["status"] == "confirmed"
    assert received["package"]["status"] == "received"
    assert received["package"]["arrival_note"] == "Courier seal checked"

    assign_response = client.post(
        "/api/v1/host/operations/pickup-confirmed-002/actions",
        json={"action": "assign_storage", "storage_slot_id": "slot-river-b201", "note": "Stored in B201"},
    )

    assert assign_response.status_code == 200
    assigned_payload = assign_response.json()
    assigned = assigned_payload["pickup_request"]
    assert assigned["status"] == "ready_for_pickup"
    assert assigned["package"]["storage_slot_id"] == "slot-river-b201"
    assert assigned_payload["operation"]["action"] == "complete_handoff"

    handoff_response = client.post(
        "/api/v1/host/operations/pickup-confirmed-002/actions",
        json={"action": "complete_handoff", "pickup_code": "482913", "note": "Code verified by staff"},
    )

    assert handoff_response.status_code == 200
    completed = handoff_response.json()["pickup_request"]
    assert completed["status"] == "completed"
    assert completed["package"]["status"] == "picked_up"


def test_host_operations_reject_invalid_transition() -> None:
    response = client.post(
        "/api/v1/host/operations/pickup-ready-001/actions",
        json={"action": "assign_storage", "storage_slot_id": "slot-maple-a102", "note": "Already ready"},
    )

    assert response.status_code == 409
    assert "cannot transition" in response.json()["detail"]
