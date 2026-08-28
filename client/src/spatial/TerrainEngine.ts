import * as THREE from 'three'
import type { Asset } from '../types'
import { latLngToLocal, localToThree } from './CoordinateSystem'
import { terrainProviderConfig } from './TerrainProvider'

export type TerrainLayerState = {
  terrain: boolean
  roads: boolean
  buildings: boolean
  vehicles: boolean
  routes: boolean
  risk: boolean
  telemetry: boolean
  simulation: boolean
}

export function getTerrainDefaultLayers(): TerrainLayerState {
  return {
    terrain: true,
    roads: true,
    buildings: true,
    vehicles: true,
    routes: true,
    risk: true,
    telemetry: true,
    simulation: true,
  }
}

export function createTerrainHeightField(size = 52, segments = 84) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
  const positions = geometry.attributes.position as THREE.BufferAttribute

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const ridge = Math.exp(-((x * x) / 180 + (y * y) / 180)) * 6
    const plateau = Math.sin((x + 8) * 0.38) * 1.4 + Math.cos((y - 5) * 0.45) * 1.6
    const contour = Math.max(0, 1.5 - Math.abs(x + 14) / 12) + Math.max(0, 1.4 - Math.abs(y - 12) / 9)
    const elevation = ridge + plateau + contour * 2.2
    positions.setZ(i, elevation)
  }

  geometry.computeVertexNormals()
  return geometry
}

export function createTerrainScene(assets: Asset[]) {
  const group = new THREE.Group()
  const terrain = new THREE.Mesh(
    createTerrainHeightField(),
    new THREE.MeshStandardMaterial({
      color: terrainProviderConfig.active ? '#17314a' : '#1f2d3d',
      metalness: 0.12,
      roughness: 0.9,
      emissive: '#0f172a',
    })
  )

  terrain.rotation.x = -Math.PI / 2
  terrain.position.y = -1.8
  group.add(terrain)

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 10),
    new THREE.MeshStandardMaterial({ color: '#0b4d75', transparent: true, opacity: 0.72, roughness: 0.2, metalness: 0.16 })
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(-15, -1.5, 12)
  group.add(water)

  const roads = [
    [-18, 0, 10, 0, 0, 5],
    [0, 0, 5, 18, 0, -6],
    [-12, 0, 0, -2, 0, -15],
    [7, 0, 8, 15, 0, -15],
    [-8, 0, 2, 8, 0, -4],
  ]

  roads.forEach(([x1, _y1, z1, x2, _y2, z2], index) => {
    const dx = x2 - x1
    const dz = z2 - z1
    const length = Math.hypot(dx, dz)
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.1, 1.3),
      new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? '#64748b' : '#475569', roughness: 0.75, metalness: 0.18 })
    )
    mesh.position.set((x1 + x2) / 2, 0.1, (z1 + z2) / 2)
    mesh.rotation.y = Math.atan2(dz, dx)
    group.add(mesh)
  })

  const sitePositions = [
    { label: 'PORT', position: [-18, 0, 10], size: [6.6, 3.8, 8], color: '#1e293b' },
    { label: 'FACTORY', position: [7, 0, 8], size: [8.8, 3.4, 6.8], color: '#1f2937' },
    { label: 'WAREHOUSE', position: [19, 0, -12], size: [8.8, 4.2, 9.4], color: '#1e293b' },
  ]

  sitePositions.forEach((site) => {
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(site.size[0], site.size[1], site.size[2]),
      new THREE.MeshStandardMaterial({ color: site.color, roughness: 0.7, metalness: 0.18 })
    )
    building.position.set(site.position[0], site.size[1] / 2, site.position[2])
    group.add(building)
  })

  assets.forEach((asset) => {
    const origin = { lat: 13.0827, lng: 80.2707, alt: 0 }
    const local = latLngToLocal(origin, { lat: asset.physicalState.lat, lng: asset.physicalState.lng, alt: asset.physicalState.verificationConfidence })
    const world = localToThree(local)

    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.7, 1.1, 16),
      new THREE.MeshStandardMaterial({
        color: asset.riskAssessment.riskLevel === 'CRITICAL' ? '#f87171' : asset.riskAssessment.riskLevel === 'HIGH' ? '#f97316' : '#67e8f9',
        emissive: '#0f172a',
      })
    )

    marker.position.set(world.x, world.y + 0.9, world.z)
    marker.userData = { assetId: asset.assetId }
    group.add(marker)
  })

  return group
}
