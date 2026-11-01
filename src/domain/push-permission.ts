/**
 * The native consent invitation must be visible once per installation when
 * notifications are disabled. The previous automatic request attempted to
 * persist "asked" before Android had actually shown its system dialog.
 */
export function shouldShowPushOnboarding(
  platform: string,
  isPhysicalBuild: boolean,
  permissionGranted: boolean,
  dismissed: boolean,
): boolean {
  return (platform === "android" || platform === "ios")
    && isPhysicalBuild && !permissionGranted && !dismissed;
}
