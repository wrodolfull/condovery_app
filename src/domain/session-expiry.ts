/** A late 401 from a previous login must never invalidate the current one. */
export function expirationBelongsToCurrentLogin(
  requestToken:string|null,
  currentToken:string|null,
):boolean {
  return requestToken!==null&&requestToken===currentToken;
}
