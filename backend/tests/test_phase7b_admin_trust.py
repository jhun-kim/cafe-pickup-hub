from fastapi.testclient import TestClient

from cafe_pickup_hub.main import app

client = TestClient(app)


def test_admin_trust_queue_lists_incident_risk_and_audit_context() -> None:
    response = client.get("/api/v1/admin/trust")

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["open_incidents"] == 2
    assert payload["summary"]["high_risk_items"] == 1
    assert payload["summary"]["audit_events"] >= 2
    assert payload["items"][0]["incident"]["status"] == "open"
    assert payload["items"][0]["risk"]["level"] == "high"
    assert payload["items"][0]["recommended_action"] == "start_review"
    assert payload["audit_logs"][0]["entity_type"] == "IncidentReport"


def test_admin_trust_action_starts_review_and_records_audit_log() -> None:
    response = client.post(
        "/api/v1/admin/trust/incidents/incident-code-mismatch/actions",
        json={
            "action": "start_review",
            "admin_user_id": "admin-ops-1",
            "note": "Reviewed code mismatch evidence",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["incident"]["status"] == "under_review"
    assert payload["risk"]["level"] == "medium"
    assert payload["latest_audit_log"]["action"] == "start_review"
    assert payload["latest_audit_log"]["admin_user_id"] == "admin-ops-1"


def test_admin_trust_action_rejects_invalid_transition() -> None:
    first_response = client.post(
        "/api/v1/admin/trust/incidents/incident-code-mismatch/actions",
        json={"action": "resolve", "admin_user_id": "admin-ops-1", "note": "Resolved once"},
    )
    second_response = client.post(
        "/api/v1/admin/trust/incidents/incident-code-mismatch/actions",
        json={"action": "start_review", "admin_user_id": "admin-ops-1", "note": "Cannot reopen"},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 409
    assert "cannot transition" in second_response.json()["detail"]


def test_admin_trust_terminal_incident_has_no_recommended_action() -> None:
    escalate_response = client.post(
        "/api/v1/admin/trust/incidents/incident-overdue-storage/actions",
        json={"action": "escalate", "admin_user_id": "admin-ops-1", "note": "Escalate overdue storage"},
    )
    queue_response = client.get("/api/v1/admin/trust")

    assert escalate_response.status_code == 200
    assert escalate_response.json()["incident"]["status"] == "escalated"
    assert escalate_response.json()["recommended_action"] is None

    assert queue_response.status_code == 200
    escalated_item = next(item for item in queue_response.json()["items"] if item["incident"]["id"] == "incident-overdue-storage")
    assert escalated_item["incident"]["status"] == "escalated"
    assert escalated_item["recommended_action"] is None
