import { ShowroomExperience } from '@/components/showroom/ShowroomExperience';
import { getShowroomData } from '@/lib/showroom/showroom-data';
import type { ShowroomView } from '@/lib/store/showroom.store';

type ViewId = ShowroomView;

const viewAltText: Record<ViewId, string> = {
  front: 'Vista frontal del terreno',
  rear: 'Vista posterior del terreno',
  top: 'Vista aérea del terreno con división de lotes',
};

export default async function Home() {
  const { views, transitionUrls, lots, lotHotspots, featureHotspots } = await getShowroomData();

  if (views.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <p role="status">No hay vistas disponibles para mostrar.</p>
      </main>
    );
  }

  return (
    <ShowroomExperience
      views={views}
      transitionUrls={transitionUrls}
      viewAltText={viewAltText}
      lots={lots}
      lotHotspots={lotHotspots}
      featureHotspots={featureHotspots}
    />
  );
}
