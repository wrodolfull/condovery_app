/** Desapego uses the resident-to-resident giveaways flow, never shop products. */
export function isCommercialProductCategory(name:string):boolean {
  return name.trim().toLocaleLowerCase('pt-BR')!=='desapego';
}
