import type {PendingOrder} from "../market";

/** Recover the original uncertain POST before checking mutable shop state. */
export const shouldCheckShopAvailability=(pending:PendingOrder|null)=>pending===null;

/** A network failure or a server-side failure cannot prove no order was created. */
export function canDiscardCheckoutAttempt(status:number|null):boolean {
  return status!==null&&status>=400&&status<500&&status!==401;
}
