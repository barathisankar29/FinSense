from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional


@dataclass
class SpatialLocation:
    assetId: str
    latitude: float
    longitude: float
    altitude: float = 0.0
    heading: float = 0.0
    speed: float = 0.0
    status: str = 'LIVE'
    lifecycleStage: str = 'IN_TRANSIT'
    risk: int = 0
    timestamp: str = ''


@dataclass
class SiteBoundary:
    siteId: str
    name: str
    latitude: float
    longitude: float
    boundary: List[Dict[str, float]] = field(default_factory=list)
    terrainRegion: str = 'default'


@dataclass
class TelemetryPoint:
    assetId: str
    latitude: float
    longitude: float
    altitude: float
    speed: float
    heading: float
    source: str = 'GPS'
    timestamp: str = ''
    confidence: int = 98


@dataclass
class SimulationEvent:
    time: float
    assetId: str
    type: Literal['DELAY', 'ACCIDENT', 'WEATHER', 'ROUTE_BLOCK', 'PRICE_DROP', 'BUYER_DEFAULT', 'FINANCING_CHANGE', 'RISK_SPIKE']
    severity: Literal['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RouteSpec:
    assetId: str
    origin: SpatialLocation
    destination: SpatialLocation
    waypoints: List[Dict[str, float]] = field(default_factory=list)
    mode: str = 'SIMULATED'
