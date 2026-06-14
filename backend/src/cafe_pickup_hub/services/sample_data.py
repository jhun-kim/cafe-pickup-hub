from cafe_pickup_hub.domain.models import (
    Host,
    Hub,
    Package,
    PackageStatus,
    Payment,
    PickupAuthorization,
    PickupAuthorizationStatus,
    PickupRequest,
    PickupRequestStatus,
    StorageSlot,
    StorageSlotStatus,
    User,
)

SAMPLE_USERS: tuple[User, ...] = (
    User(id="user-jieun", display_name="Jieun Kim", phone_last4="1208"),
    User(id="user-minji", display_name="Minji Lee", phone_last4="4421"),
)

SAMPLE_HOSTS: tuple[Host, ...] = (
    Host(id="host-maple", business_name="Maple Counter Cafe", owner_user_id="user-host-maple", approved=True),
    Host(id="host-river", business_name="River Locker Espresso", owner_user_id="user-host-river", approved=True),
    Host(id="host-garden", business_name="Garden Window Roasters", owner_user_id="user-host-garden", approved=True),
)

SAMPLE_HUBS_V1: tuple[Hub, ...] = (
    Hub(
        id="hub-maple-counter",
        host_id="host-maple",
        cafe_name="Maple Counter Cafe",
        neighborhood="Seongsu",
        address="17 Yeonmujang 5-gil, Seongdong-gu",
        walk_minutes_from_station=4,
        rating=4.9,
        open_until="22:30",
        available_slots=18,
        price_per_day_krw=6500,
        trust_badges=("staff handoff", "CCTV entrance", "sealed shelf"),
        storage_slots=(
            StorageSlot(id="slot-maple-a101", hub_id="hub-maple-counter", label="A101", status=StorageSlotStatus.AVAILABLE, package_size="small"),
            StorageSlot(id="slot-maple-a102", hub_id="hub-maple-counter", label="A102", status=StorageSlotStatus.OCCUPIED, package_size="small"),
        ),
    ),
    Hub(
        id="hub-river-locker",
        host_id="host-river",
        cafe_name="River Locker Espresso",
        neighborhood="Hapjeong",
        address="9 Yanghwa-ro 6-gil, Mapo-gu",
        walk_minutes_from_station=6,
        rating=4.8,
        open_until="23:00",
        available_slots=10,
        price_per_day_krw=8200,
        trust_badges=("numbered cubbies", "late pickup", "staff verified"),
        storage_slots=(
            StorageSlot(id="slot-river-b201", hub_id="hub-river-locker", label="B201", status=StorageSlotStatus.RESERVED, package_size="medium"),
        ),
    ),
    Hub(
        id="hub-garden-window",
        host_id="host-garden",
        cafe_name="Garden Window Roasters",
        neighborhood="Yeonnam",
        address="42 Donggyo-ro 38-gil, Mapo-gu",
        walk_minutes_from_station=8,
        rating=4.7,
        open_until="21:30",
        available_slots=14,
        price_per_day_krw=5900,
        trust_badges=("quiet pickup zone", "photo receipt", "dry storage"),
        storage_slots=(
            StorageSlot(id="slot-garden-c301", hub_id="hub-garden-window", label="C301", status=StorageSlotStatus.AVAILABLE, package_size="small"),
        ),
    ),
)

SAMPLE_PICKUP_REQUESTS: tuple[PickupRequest, ...] = (
    PickupRequest(
        id="pickup-ready-001",
        user_id="user-jieun",
        hub_id="hub-maple-counter",
        status=PickupRequestStatus.READY_FOR_PICKUP,
        package=Package(id="pkg-001", pickup_request_id="pickup-ready-001", storage_slot_id="slot-maple-a102", status=PackageStatus.RECEIVED, size_label="small parcel", arrival_note="photo receipt recorded"),
        payment=Payment(id="pay-001", pickup_request_id="pickup-ready-001", amount_krw=6500, status="captured"),
        authorizations=(
            PickupAuthorization(id="auth-001", pickup_request_id="pickup-ready-001", authorized_picker_name="Minji Lee", status=PickupAuthorizationStatus.ACTIVE, code_hint="739***", expires_at="2026-06-14T20:30:00+09:00"),
        ),
        pickup_code="482913",
        pickup_window="2026-06-14 18:00-20:30",
    ),
    PickupRequest(
        id="pickup-confirmed-002",
        user_id="user-jieun",
        hub_id="hub-river-locker",
        status=PickupRequestStatus.CONFIRMED,
        package=Package(id="pkg-002", pickup_request_id="pickup-confirmed-002", storage_slot_id="slot-river-b201", status=PackageStatus.EXPECTED, size_label="medium tote", arrival_note="courier expected after 15:00"),
        payment=Payment(id="pay-002", pickup_request_id="pickup-confirmed-002", amount_krw=8200, status="authorized"),
        authorizations=(),
        pickup_code="pending",
        pickup_window="2026-06-14 19:00-22:00",
    ),
)
