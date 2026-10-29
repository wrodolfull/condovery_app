import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSellerDraft,sellerDraftScope} from '../src/domain/shop-draft';
const draft={name:'Doces',description:'De casa',whatsapp:'11999998888',logo_image:'',cover_image:'',
  is_open:true,delivery_enabled:false,pickup_enabled:true,delivery_fee_cents:'4,50',lead_time:'A combinar',pickup_instructions:'',
  payment_methods:['pix']};
test('seller draft keys separate users, condos and shops',()=>{
  const a=sellerDraftScope('u1','c1','s1');
  assert.notEqual(a,sellerDraftScope('u1','c2','s1'));
  assert.notEqual(a,sellerDraftScope('u2','c1','s1'));
  assert.notEqual(a,sellerDraftScope('u1','c1',null));
});
test('validation retains unsaved switches and real-value fees',()=>{
  assert.deepEqual(parseSellerDraft(draft),draft);
  assert.equal(parseSellerDraft({...draft,name:10}),null);
  assert.equal(parseSellerDraft({...draft,payment_methods:['unknown']}),null);
  assert.equal(parseSellerDraft('{bad json}'),null);
});
