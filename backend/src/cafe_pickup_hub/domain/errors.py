from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class InvalidStateTransitionError(Exception):
    entity: str
    current: str
    target: str

    def __str__(self) -> str:
        return f"{self.entity} cannot transition {self.current} -> {self.target}"
