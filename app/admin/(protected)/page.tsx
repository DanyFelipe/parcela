import Link from 'next/link';

import { DeleteLotButton } from '@/components/admin/DeleteLotButton';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { buttonVariants } from '@/components/ui/button';
import { getLotsForAdmin } from '@/lib/admin/lot-data';

export default async function AdminDashboardPage() {
  const lots = await getLotsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lotes</h1>
        <Link href="/admin/lots/new" className={buttonVariants()}>
          Nuevo lote
        </Link>
      </div>

      {lots.length === 0 ? (
        <p className="text-muted-foreground">No hay lotes cargados.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
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
                  <td className="px-4 py-3">
                    {lot.price ? `$${lot.price.toLocaleString('es-AR')}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {lot.surface_area ? `${lot.surface_area.toLocaleString('es-AR')} m²` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/lots/${lot.id}/edit`}
                        className={buttonVariants({ size: 'sm', variant: 'outline' })}
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/admin/lots/${lot.id}/hotspots`}
                        className={buttonVariants({ size: 'sm', variant: 'outline' })}
                      >
                        Hotspot
                      </Link>
                      <DeleteLotButton lotId={lot.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
