/** Terminal orders need a refresh on focus, but no repeated polling. */
export function orderNeedsLiveRefresh(status: string | undefined): boolean {
  return !status || status === "awaiting_confirmation" || status === "confirmed";
}
