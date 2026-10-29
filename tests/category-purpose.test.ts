import test from 'node:test';
import assert from 'node:assert/strict';
import {isCommercialProductCategory} from '../src/domain/category-purpose';
test('Desapego is exclusive to resident listings',()=>{
  assert.equal(isCommercialProductCategory('Desapego'),false);
  assert.equal(isCommercialProductCategory('desapego'),false);
  assert.equal(isCommercialProductCategory(' DESAPEGO '),false);
  assert.equal(isCommercialProductCategory('Moda'),true);
  assert.equal(isCommercialProductCategory('Mercadinho'),true);
});
