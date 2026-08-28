type XRSystemLike = {
  requestSession?: (mode: string, options?: Record<string, unknown>) => Promise<unknown>
  isSessionSupported?: (mode: string) => Promise<boolean>
}

export async function detectARSupport(): Promise<{ supported: boolean; mode: 'webxr' | 'fallback'; label: string }> {
  const hasNavigator = typeof navigator !== 'undefined'
  const xr = hasNavigator ? (navigator as Navigator & { xr?: XRSystemLike }).xr : undefined
  const supportsWebGL = typeof window !== 'undefined' && !!window.WebGLRenderingContext

  if (!xr || !supportsWebGL) {
    return { supported: false, mode: 'fallback', label: 'AR unavailable on this device' }
  }

  if (typeof xr.isSessionSupported === 'function') {
    try {
      const supported = await xr.isSessionSupported('immersive-ar')
      return {
        supported,
        mode: supported ? 'webxr' : 'fallback',
        label: supported ? 'AR supported' : 'AR unavailable on this device',
      }
    } catch {
      return { supported: false, mode: 'fallback', label: 'AR unavailable on this device' }
    }
  }

  return {
    supported: typeof xr.requestSession === 'function',
    mode: typeof xr.requestSession === 'function' ? 'webxr' : 'fallback',
    label: typeof xr.requestSession === 'function' ? 'AR supported' : 'AR unavailable on this device',
  }
}

export async function requestARSession(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false

  const xr = (navigator as Navigator & { xr?: XRSystemLike }).xr
  if (!xr) return false

  try {
    const supported = xr.isSessionSupported ? await xr.isSessionSupported('immersive-ar') : true
    if (!supported && typeof xr.requestSession !== 'function') return false

    if (typeof xr.requestSession === 'function') {
      await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body },
      })
      return true
    }
  } catch {
    return false
  }

  return false
}

export function getARFallbackMessage() {
  return 'AR unavailable on this device. Continuing in interactive 3D spatial mode.'
}
