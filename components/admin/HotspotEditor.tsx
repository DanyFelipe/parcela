'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteLotHotspot, upsertLotHotspot } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import type { AdminLotHotspot, AdminView } from '@/lib/admin/view-data';

interface HotspotEditorProps {
  lotId: string;
  lotName: string;
  view: AdminView;
  existingHotspot: AdminLotHotspot | null;
}

interface Marker {
  x: number;
  y: number;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function HotspotEditor({ lotId, view, existingHotspot }: HotspotEditorProps) {
  const router = useRouter();
  const [marker, setMarker] = useState<Marker | null>(
    existingHotspot ? { x: existingHotspot.hotspot_x, y: existingHotspot.hotspot_y } : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleImageClick(event: React.MouseEvent<HTMLImageElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setMarker({ x: clamp(x), y: clamp(y) });
    setSaved(false);
    setActionError(null);
  }

  async function handleSave() {
    if (!marker) return;

    setActionError(null);
    setIsSaving(true);

    try {
      const result = await upsertLotHotspot(lotId, view.id, marker.x, marker.y);
      if (!result.success) {
        setActionError(result.message);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar el hotspot de este lote?')) return;

    setActionError(null);
    setIsDeleting(true);

    try {
      const result = await deleteLotHotspot(lotId, view.id);
      if (!result.success) {
        setActionError(result.message);
        return;
      }
      setMarker(null);
      setSaved(false);
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Hacé clic sobre la imagen para fijar la posición del hotspot. Guardá para persistir el
        cambio.
      </p>

      {actionError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="relative inline-block max-w-full overflow-hidden rounded-xl border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={view.base_image_url}
          alt="Vista top"
          onClick={handleImageClick}
          className="block max-h-[70vh] cursor-crosshair object-contain"
        />
        {marker && (
          <span
            className="absolute flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-accent shadow-hotspot"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            aria-label="Hotspot seleccionado"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={!marker || isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar hotspot'}
        </Button>
        <Button variant="outline" onClick={handleDelete} disabled={!marker || isDeleting}>
          {isDeleting ? 'Eliminando...' : 'Eliminar hotspot'}
        </Button>
        {saved && <span className="text-sm text-status-available">Guardado correctamente</span>}
        {marker && (
          <span className="text-sm text-muted-foreground">
            X: {marker.x.toFixed(2)}% · Y: {marker.y.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}
