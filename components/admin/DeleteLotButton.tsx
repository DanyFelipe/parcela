'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteLot } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeleteLotButtonProps {
  lotId: string;
  /** Clases del contenedor (ej. alineación según tarjeta o tabla). */
  className?: string;
  /** Clases del botón (ej. ancho completo y alto de toque en mobile). */
  buttonClassName?: string;
}

export function DeleteLotButton({ lotId, className, buttonClassName }: DeleteLotButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm('¿Eliminar este lote? Esta acción no se puede deshacer.')) {
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const result = await deleteLot(lotId);
      if (!result.success) {
        setError(result.message);
        return;
      }

      router.refresh();
    } catch {
      setError('No se pudo eliminar el lote. Intentá nuevamente.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Button
        variant="destructive"
        size="sm"
        className={buttonClassName}
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? 'Eliminando...' : 'Eliminar'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
