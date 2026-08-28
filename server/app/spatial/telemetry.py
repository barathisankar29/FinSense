from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict


class TelemetryService:
    def __init__(self):
        self.points: list[Dict[str, Any]] = []

    def record(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        entry = {
            **payload,
            'timestamp': payload.get('timestamp') or datetime.now(timezone.utc).isoformat(),
            'source': payload.get('source', 'GPS'),
            'confidence': payload.get('confidence', 98),
        }
        self.points.append(entry)
        return entry

    def list_recent(self, asset_id: str, limit: int = 20) -> list[Dict[str, Any]]:
        return [point for point in self.points if point.get('assetId') == asset_id][-limit:]
