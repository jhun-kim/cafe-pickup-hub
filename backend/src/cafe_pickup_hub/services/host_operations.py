from dataclasses import dataclass
from typing import assert_never

from cafe_pickup_hub.domain.errors import InvalidStateTransitionError
from cafe_pickup_hub.domain.models import HostOperationAction, Hub, PackageStatus, PickupRequest, PickupRequestStatus
from cafe_pickup_hub.domain.transitions import transition_package_status, transition_pickup_request_status
from cafe_pickup_hub.schemas import HostOperationActionRequest
from cafe_pickup_hub.services.catalog import CatalogService, get_catalog_service
from cafe_pickup_hub.services.pickup_requests import HubNotFoundError, get_pickup_request_repository
from cafe_pickup_hub.services.repository import InMemoryPickupRequestRepository


@dataclass(frozen=True, slots=True)
class PickupRequestNotFoundError(Exception):
    pickup_request_id: str

    def __str__(self) -> str:
        return f"PickupRequest {self.pickup_request_id} not found"


@dataclass(frozen=True, slots=True)
class StorageSlotNotFoundError(Exception):
    storage_slot_id: str

    def __str__(self) -> str:
        return f"StorageSlot {self.storage_slot_id} not found"


@dataclass(frozen=True, slots=True)
class HostOperationSummary:
    action: HostOperationAction
    label: str
    priority: int
    next_action: HostOperationAction | None
    safety_note: str


@dataclass(frozen=True, slots=True)
class HostOperationItem:
    hub: Hub
    pickup_request: PickupRequest
    operation: HostOperationSummary


@dataclass(frozen=True, slots=True)
class HostOperationService:
    repository: InMemoryPickupRequestRepository
    catalog_service: CatalogService

    def list_host_operations(self) -> tuple[HostOperationItem, ...]:
        hubs = self.catalog_service.list_hubs()
        operations = [
            HostOperationItem(hub=hub, pickup_request=pickup_request, operation=summarize_host_operation(pickup_request))
            for pickup_request in self.repository.list_pickup_requests()
            for hub in hubs
            if hub.id == pickup_request.hub_id and is_host_actionable(pickup_request)
        ]
        return tuple(sorted(operations, key=lambda item: (item.operation.priority, item.pickup_request.pickup_window)))

    def apply_host_operation(self, pickup_request_id: str, payload: HostOperationActionRequest) -> HostOperationItem:
        pickup_request = self.repository.get_pickup_request(pickup_request_id)
        if pickup_request is None:
            raise PickupRequestNotFoundError(pickup_request_id=pickup_request_id)

        hub = self._find_hub(pickup_request.hub_id)
        require_storage_slot_for_action(hub, payload)
        saved = self.repository.update_pickup_request(apply_host_operation_transition(pickup_request, payload))
        return HostOperationItem(hub=hub, pickup_request=saved, operation=summarize_host_operation(saved))

    def _find_hub(self, hub_id: str) -> Hub:
        hub = next((candidate for candidate in self.catalog_service.list_hubs() if candidate.id == hub_id), None)
        if hub is None:
            raise HubNotFoundError(hub_id=hub_id)
        return hub


def require_storage_slot_for_action(hub: Hub, payload: HostOperationActionRequest) -> None:
    match payload.action:
        case HostOperationAction.ASSIGN_STORAGE:
            require_storage_slot(hub, payload.storage_slot_id)
        case HostOperationAction.RECEIVE_PACKAGE | HostOperationAction.COMPLETE_HANDOFF:
            pass
        case unreachable:
            assert_never(unreachable)


def require_storage_slot(hub: Hub, storage_slot_id: str | None) -> None:
    if storage_slot_id is None:
        raise StorageSlotNotFoundError(storage_slot_id="")
    slot = next((candidate for candidate in hub.storage_slots if candidate.id == storage_slot_id), None)
    if slot is None:
        raise StorageSlotNotFoundError(storage_slot_id=storage_slot_id)


def apply_host_operation_transition(
    pickup_request: PickupRequest,
    payload: HostOperationActionRequest,
) -> PickupRequest:
    match payload.action:
        case HostOperationAction.RECEIVE_PACKAGE:
            received_status = transition_package_status(pickup_request.package.status, PackageStatus.RECEIVED)
            return pickup_request.model_copy(
                update={"package": pickup_request.package.model_copy(update={"status": received_status, "arrival_note": payload.note})},
            )
        case HostOperationAction.ASSIGN_STORAGE:
            require_received_package(pickup_request)
            ready_status = transition_pickup_request_status(pickup_request.status, PickupRequestStatus.READY_FOR_PICKUP)
            return pickup_request.model_copy(
                update={
                    "status": ready_status,
                    "package": pickup_request.package.model_copy(update={"storage_slot_id": payload.storage_slot_id}),
                },
            )
        case HostOperationAction.COMPLETE_HANDOFF:
            picked_up_status = transition_package_status(pickup_request.package.status, PackageStatus.PICKED_UP)
            completed_status = transition_pickup_request_status(pickup_request.status, PickupRequestStatus.COMPLETED)
            return pickup_request.model_copy(
                update={
                    "status": completed_status,
                    "package": pickup_request.package.model_copy(update={"status": picked_up_status}),
                },
            )
        case unreachable:
            assert_never(unreachable)


def require_received_package(pickup_request: PickupRequest) -> None:
    match pickup_request.package.status:
        case PackageStatus.RECEIVED:
            pass
        case PackageStatus.EXPECTED | PackageStatus.PICKED_UP | PackageStatus.NOT_RECEIVED | PackageStatus.DISPUTED:
            raise InvalidStateTransitionError(
                entity="HostOperation",
                current=pickup_request.package.status.value,
                target=HostOperationAction.ASSIGN_STORAGE.value,
            )
        case unreachable:
            assert_never(unreachable)


def is_host_actionable(pickup_request: PickupRequest) -> bool:
    match pickup_request.status:
        case PickupRequestStatus.CONFIRMED | PickupRequestStatus.READY_FOR_PICKUP:
            return True
        case (
            PickupRequestStatus.DRAFT
            | PickupRequestStatus.COMPLETED
            | PickupRequestStatus.CANCELED
            | PickupRequestStatus.EXPIRED
            | PickupRequestStatus.DISPUTED
            | PickupRequestStatus.PAYMENT_FAILED
        ):
            return False
        case unreachable:
            assert_never(unreachable)


def summarize_host_operation(pickup_request: PickupRequest) -> HostOperationSummary:
    match pickup_request.status:
        case PickupRequestStatus.CONFIRMED:
            return summarize_confirmed_request(pickup_request)
        case PickupRequestStatus.READY_FOR_PICKUP:
            return HostOperationSummary(
                action=HostOperationAction.COMPLETE_HANDOFF,
                label="픽업 완료",
                priority=3,
                next_action=None,
                safety_note="고객 코드와 위임 권한을 확인한 뒤 완료 처리합니다.",
            )
        case (
            PickupRequestStatus.DRAFT
            | PickupRequestStatus.COMPLETED
            | PickupRequestStatus.CANCELED
            | PickupRequestStatus.EXPIRED
            | PickupRequestStatus.DISPUTED
            | PickupRequestStatus.PAYMENT_FAILED
        ):
            return inactive_operation_summary()
        case unreachable:
            assert_never(unreachable)


def summarize_confirmed_request(pickup_request: PickupRequest) -> HostOperationSummary:
    match pickup_request.package.status:
        case PackageStatus.EXPECTED:
            return HostOperationSummary(
                action=HostOperationAction.RECEIVE_PACKAGE,
                label="입고 등록",
                priority=1,
                next_action=HostOperationAction.ASSIGN_STORAGE,
                safety_note="배송기사 도착 후 포장 훼손 여부를 확인합니다.",
            )
        case PackageStatus.RECEIVED:
            return HostOperationSummary(
                action=HostOperationAction.ASSIGN_STORAGE,
                label="보관함 배정",
                priority=2,
                next_action=HostOperationAction.COMPLETE_HANDOFF,
                safety_note="보관함 번호와 물품 크기를 다시 확인합니다.",
            )
        case PackageStatus.PICKED_UP | PackageStatus.NOT_RECEIVED | PackageStatus.DISPUTED:
            raise InvalidStateTransitionError(
                entity="HostOperation",
                current=pickup_request.package.status.value,
                target=pickup_request.status.value,
            )
        case unreachable:
            assert_never(unreachable)


def inactive_operation_summary() -> HostOperationSummary:
    return HostOperationSummary(
        action=HostOperationAction.RECEIVE_PACKAGE,
        label="조치 없음",
        priority=9,
        next_action=None,
        safety_note="현재 호스트 작업 대상이 아닙니다.",
    )


def get_host_operation_service() -> HostOperationService:
    return HostOperationService(repository=get_pickup_request_repository(), catalog_service=get_catalog_service())
