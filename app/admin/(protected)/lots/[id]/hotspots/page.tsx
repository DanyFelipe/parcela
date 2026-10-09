import { notFound } from 'next/navigation';

import { HotspotEditor } from '@/components/admin/HotspotEditor';
import { getLotByIdForAdmin } from '@/lib/admin/lot-data';
import { getLotHotspotForAdmin, getTopViewForAdmin } from '@/lib/admin/view-data';
import { lotIdSchema } from '@/lib/validations/lot.schema';

interface HotspotPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Hotspot',
};

export default async function HotspotPage({ params }: HotspotPageProps) {
  const { id } = await params;

  if (!lotIdSchema.safeParse(id).success) {
    notFound();
  }

  const [lot, view, hotspot] = await Promise.all([
    getLotByIdForAdmin(id),
    getTopViewForAdmin(),
    getLotHotspotForAdmin(id, 'top'),
  ]);

  if (!lot) {
    notFound();
  }

  if (!view) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Hotspot: {lot.name}</h1>
        <p className="text-destructive">
          No se encontró la vista <code>top</code> en la base de datos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hotspot: {lot.name}</h1>
      <HotspotEditor lotId={id} lotName={lot.name} view={view} existingHotspot={hotspot} />
    </div>
  );
}
