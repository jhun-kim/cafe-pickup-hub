from fastapi import APIRouter, HTTPException, status

from cafe_pickup_hub.domain.errors import InvalidStateTransitionError
from cafe_pickup_hub.schemas import AdminTrustActionRequest, AdminTrustItemResponse, AdminTrustQueueResponse
from cafe_pickup_hub.services.admin_trust import (
    AdminTrustIncidentNotFoundError,
    AdminTrustItem,
    AdminTrustQueue,
    AdminTrustService,
    get_admin_trust_service,
)

router = APIRouter(tags=["v1-admin-trust"])


@router.get("/admin/trust", response_model=AdminTrustQueueResponse)
def list_admin_trust_queue() -> AdminTrustQueue:
    service: AdminTrustService = get_admin_trust_service()
    return service.list_trust_queue()


@router.post("/admin/trust/incidents/{incident_id}/actions", response_model=AdminTrustItemResponse)
def apply_admin_trust_action(incident_id: str, payload: AdminTrustActionRequest) -> AdminTrustItem:
    service: AdminTrustService = get_admin_trust_service()
    try:
        return service.apply_incident_action(incident_id, payload)
    except AdminTrustIncidentNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidStateTransitionError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
