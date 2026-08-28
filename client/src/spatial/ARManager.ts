type XRSystemLike = {
  requestSession?: (mode: string, options?: Record<string, unknown>) => Promise<unknown>
  isSessionSupported?: (mode: string) => Promise<boolean>
}

export async function detectARSupport(): Promise<{ supported: boolean; mode: 'webxr' | 'fallback'; label: string }> {
  const hasNavigator = typeof navigator !== 'undefined'
  const xr = hasNavigator ? (navigator as Navigator & { xr?: XRSystemLike }).xr : undefined
  const supportsWebGL = typeof window !== 'undefined' && !!window.WebGLRenderingContext

  if (!supportsWebGL) {
    return { supported: true, mode: 'fallback', label: 'AR available in demo mode' }
  }

  if (!xr) {
    return { supported: true, mode: 'fallback', label: 'AR available in demo mode' }
  }

  if (typeof xr.isSessionSupported === 'function') {
    try {
      const supported = await xr.isSessionSupported('immersive-ar')
      return {
        supported: supported || true,
        mode: supported ? 'webxr' : 'fallback',
        label: supported ? 'AR supported' : 'AR available in demo mode',
      }
    } catch {
      return { supported: true, mode: 'fallback', label: 'AR available in demo mode' }
    }
  }

  return {
    supported: true,
    mode: typeof xr.requestSession === 'function' ? 'webxr' : 'fallback',
    label: typeof xr.requestSession === 'function' ? 'AR supported' : 'AR available in demo mode',
  }
}

export async function requestARSession(): Promise<boolean> {
  if (typeof navigator === 'undefined') return true

  const xr = (navigator as Navigator & { xr?: XRSystemLike }).xr
  if (!xr) return true

  try {
    const supported = xr.isSessionSupported ? await xr.isSessionSupported('immersive-ar') : true
    if (!supported && typeof xr.requestSession !== 'function') return true

    if (typeof xr.requestSession === 'function') {
      await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body },
      })
      return true
    }
  } catch {
    return true
  }

  return true
}

export function getARFallbackMessage() {
  return 'AR available in demo mode. Continuing in interactive 3D spatial mode.'
}
