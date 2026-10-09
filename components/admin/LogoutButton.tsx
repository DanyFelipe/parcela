'use client';

import { useState } from 'react';

import { logout } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);

    try {
      await logout();
    } catch {
      setIsPending(false);
      setError('No se pudo cerrar la sesión.');
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? 'Saliendo...' : 'Salir'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
