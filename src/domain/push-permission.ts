/**
 * Android 13+ shows the notification system dialog only when requested.
 * Ask once after the first authenticated session while permission is undecided.
 * Do not reprompt after a denial: the user can opt in from Preferences.
 */
export type PushPermissionSnapshot = {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
};

export function shouldAutoRequestPushPermission(
  platform: string,
  permission: PushPermissionSnapshot,
  previouslyPrompted: boolean,
): boolean {
  return (
    platform === "android" &&
    !previouslyPrompted &&
    permission.status === "undetermined" &&
    !permission.granted &&
    permission.canAskAgain
  );
}
