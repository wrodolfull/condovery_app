import {allowedPaymentMethods,type PaymentMethod} from './payment-methods';

export type ShopDraft={
  name:string;description:string;whatsapp:string;logo_image:string;cover_image:string;
  is_open:boolean;delivery_enabled:boolean;pickup_enabled:boolean;delivery_fee_cents:string;
  lead_time:string;pickup_instructions:string;payment_methods:PaymentMethod[];
};
export function sellerDraftScope(ownerId:string,condoId:string,shopId:string|null) {
  return 'shop.draft.v1.'+ownerId+'.'+condoId+'.'+(shopId??'new');
}
export function parseSellerDraft(value:unknown):ShopDraft|null {
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const form=value as Record<string,unknown>;
  for(const key of ['name','description','whatsapp','logo_image','cover_image','delivery_fee_cents','lead_time','pickup_instructions']) {
    if(typeof form[key]!=='string'||(form[key] as string).length>1000)return null;
  }
  for(const key of ['is_open','delivery_enabled','pickup_enabled'])
    if(typeof form[key]!=='boolean')return null;
  if(!Array.isArray(form.payment_methods)||form.payment_methods.length>4 ||
    !form.payment_methods.every(method=>['pix','credit_card','debit_card','cash'].includes(method)))return null;
  return {...form,payment_methods:allowedPaymentMethods(form.payment_methods as PaymentMethod[])} as ShopDraft;
}
