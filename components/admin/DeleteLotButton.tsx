'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteLot } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

interface DeleteLotButtonProps {
  lotId: string;
}

export function DeleteLotButton({ lotId }: DeleteLotButtonProps) {
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
    <div className="flex flex-col items-end gap-1">
      <Button variant="destructive" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? 'Eliminando...' : 'Eliminar'}
      </Button>
      {error && <span className="max-w-48 text-right text-xs text-destructive">{error}</span>}
    </div>
  );
}
