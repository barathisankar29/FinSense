from __future__ import annotations

from typing import Any, Dict


class TrackingService:
    def __init__(self):
        self.positions: Dict[str, Dict[str, Any]] = {}

    def update_position(self, asset_id: str, position: Dict[str, Any]) -> Dict[str, Any]:
        self.positions[asset_id] = position
        return position

    def get_position(self, asset_id: str) -> Dict[str, Any]:
        return self.positions.get(asset_id, {})
