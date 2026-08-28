# FinSense India 3D / AR logistics map patch

Replace these files in `client/src/`:

- `pages/MapPage.tsx`
- `spatial/LogisticsWorld.tsx`
- `spatial/indiaLogisticsData.ts`
- `components/logistics/IndiaTerrain.tsx`
- `components/logistics/FacilityModel.tsx`
- `components/logistics/RouteNetwork.tsx`
- append the supplied map CSS to `style.css`

What this changes:

- Real India boundary loaded from the Datameet simplified India GeoJSON at runtime.
- Procedural 3D relief is generated over the real India boundary.
- Nationwide logistics network with glowing branch routes.
- Ahmedabad factory, Nashik warehouse, Mumbai transit hub, Nhava Sheva port and additional network nodes.
- Clickable 3D facilities with detail panels.
- AS-1042 truck moves slowly along the Ahmedabad -> Nashik -> Mumbai -> Nhava Sheva corridor.
- Play / pause / reset / follow truck controls.
- 2D OpenStreetMap mode, 3D India terrain mode and AR-style mode.
- WebXR immersive-AR launch when the device/browser supports it; otherwise the 3D terrain remains as the fallback.
- Existing FinSense API is still used for AS-1042 financial/risk details when available.

Important:

The 3D relief is a visual terrain layer, not a surveyed DEM. For true elevation data, add a terrain provider such as MapTiler/Mapbox/Cesium later. The India boundary itself comes from published GeoJSON rather than a hand-drawn polygon.
