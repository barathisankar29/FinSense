from typing import List, Dict, Any, Tuple
from ..models import DataSourceEntry, DataConflict

def reconcile_data_sources(sources: List[DataSourceEntry]) -> Tuple[List[DataConflict], int, str]:
    conflicts: List[DataConflict] = []
    
    # Group by field
    fields_map: Dict[str, List[DataSourceEntry]] = {}
    for s in sources:
        fields_map.setdefault(s.field, []).append(s)
        
    avg_confidence = int(sum(s.confidence for s in sources) / max(1, len(sources)))
    
    for field, entries in fields_map.items():
        if len(entries) > 1:
            values = set(e.value for e in entries)
            if len(values) > 1:
                # Conflict found
                src_a, src_b = entries[0], entries[1]
                conflicts.append(DataConflict(
                    field=field,
                    sourceA=src_a.source,
                    valueA=src_a.value,
                    sourceB=src_b.source,
                    valueB=src_b.value,
                    discrepancy=f'Discrepancy of {src_a.value} ({src_a.source}) vs {src_b.value} ({src_b.source})',
                    resolution=f'Pause additional financing until physical/digital reconciliation between {src_a.source} and {src_b.source} completes.',
                    confidence=min(src_a.confidence, src_b.confidence)
                ))
                avg_confidence = max(40, avg_confidence - 18)
                
    if conflicts:
        recommendation = 'PAUSE FINANCING: Multi-source discrepancies detected. Reconcile warehouse receipts with ERP inventory records before approving credit lines.'
    else:
        recommendation = 'DATA SYNCHRONIZED: 100% consensus across ERP, WMS, Logistics, and Banking telemetry.'
        
    return conflicts, avg_confidence, recommendation
