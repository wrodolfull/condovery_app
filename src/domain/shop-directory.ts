/** Merge paged shop results without duplicate cards when availability changes. */
export function appendUniqueShops<T extends {id:string}>(previous:T[],incoming:T[]):T[] {
  const shops=new Map(previous.map(shop=>[shop.id,shop]));
  for(const shop of incoming)shops.set(shop.id,shop);
  return Array.from(shops.values());
}
