import Link from 'next/link';

import { LotRowActions } from '@/components/admin/LotRowActions';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { buttonVariants } from '@/components/ui/button';
import { getLotsForAdmin } from '@/lib/admin/lot-data';

function formatPrice(price: number | null): string {
  return price ? `$${price.toLocaleString('es-AR')}` : '-';
}

function formatSurface(surfaceArea: number | null): string {
  return surfaceArea ? `${surfaceArea.toLocaleString('es-AR')} m²` : '-';
}

export default async function AdminDashboardPage() {
  const lots = await getLotsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Lotes</h1>
        <Link href="/admin/lots/new" className={buttonVariants()}>
          Nuevo lote
        </Link>
      </div>

      {lots.length === 0 ? (
        <p className="text-muted-foreground">No hay lotes cargados.</p>
      ) : (
        <>
          {/* Mobile: tarjetas, para no comprimir una tabla de 5 columnas */}
          <ul className="space-y-3 md:hidden" aria-label="Listado de lotes">
            {lots.map((lot) => (
              <li key={lot.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lot.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPrice(lot.price)} · {formatSurface(lot.surface_area)}
                    </p>
                  </div>
                  <StatusBadge status={lot.status} />
                </div>
                <div className="mt-4">
                  <LotRowActions lotId={lot.id} layout="card" />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: tabla, con scroll horizontal de seguridad si no entra */}
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Superficie</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lots.map((lot) => (
                  <tr key={lot.id}>
                    <td className="px-4 py-3 font-medium">{lot.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lot.status} />
                    </td>
                    <td className="px-4 py-3">{formatPrice(lot.price)}</td>
                    <td className="px-4 py-3">{formatSurface(lot.surface_area)}</td>
                    <td className="px-4 py-3">
                      <LotRowActions lotId={lot.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
