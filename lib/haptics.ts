/**
 * Trigger a haptic vibration if the browser supports it.
 * Falls back silently on unsupported devices / desktops.
 */
export function triggerHaptic(pattern: number | number[] = 50) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
