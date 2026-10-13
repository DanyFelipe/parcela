import Link from 'next/link';

import { DeleteLotButton } from '@/components/admin/DeleteLotButton';
import { buttonVariants } from '@/components/ui/button';

interface LotRowActionsProps {
  lotId: string;
  /** `card` apila en dos columnas para mobile; `table` alinea a la derecha. */
  layout?: 'card' | 'table';
}

/**
 * Acciones de un lote, compartidas por el listado en tarjetas (mobile) y la tabla
 * (desktop), para no duplicar la lógica ni los estilos.
 */
export function LotRowActions({ lotId, layout = 'table' }: LotRowActionsProps) {
  if (layout === 'card') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/admin/lots/${lotId}/edit`}
          className={buttonVariants({ variant: 'outline', className: 'min-h-11' })}
        >
          Editar
        </Link>
        <Link
          href={`/admin/lots/${lotId}/hotspots`}
          className={buttonVariants({ variant: 'outline', className: 'min-h-11' })}
        >
          Hotspot
        </Link>
        <DeleteLotButton lotId={lotId} className="col-span-2" buttonClassName="min-h-11 w-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/lots/${lotId}/edit`}
        className={buttonVariants({ size: 'sm', variant: 'outline' })}
      >
        Editar
      </Link>
      <Link
        href={`/admin/lots/${lotId}/hotspots`}
        className={buttonVariants({ size: 'sm', variant: 'outline' })}
      >
        Hotspot
      </Link>
      <DeleteLotButton lotId={lotId} className="items-end" />
    </div>
  );
}
