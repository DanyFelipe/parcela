export function formatPrice(price: number | null): string {
  if (price === null) {
    return 'Consultar precio';
  }

  return `$ ${price.toLocaleString('es-AR')}`;
}

export function formatSurface(area: number | null): string {
  if (area === null) {
    return 'Superficie no disponible';
  }

  return `${area.toLocaleString('es-AR')} m²`;
}
