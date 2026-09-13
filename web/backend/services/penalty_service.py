from ..models.player import Player


def apply_penalty(player: Player, minutes: int) -> Player:
    return player.model_copy(update={"penalties": player.penalties + minutes})


def report_penalty_if_approved(approvals: list[str], eligible_voters: int = 4) -> int:
    return 5 if len(approvals) >= eligible_voters else 0

