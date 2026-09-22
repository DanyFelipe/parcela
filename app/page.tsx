/* eslint-disable @next/next/no-img-element */

import { createClient } from '@/lib/supabase/server';

type ViewId = 'front' | 'rear' | 'top';

interface View {
  id: ViewId;
  display_order: number;
  base_image_url: string;
  alt_image_url: string | null;
}

const viewAltText: Record<ViewId, string> = {
  front: 'Vista frontal del terreno',
  rear: 'Vista posterior del terreno',
  top: 'Vista aérea del terreno con división de lotes',
};

async function getViews(): Promise<View[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('views')
    .select('id, display_order, base_image_url, alt_image_url')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error loading showroom views', { error });
    throw new Error('No se pudieron cargar las vistas del terreno.');
  }

  return (data ?? []).filter((view): view is View => {
    return view.id === 'front' || view.id === 'rear' || view.id === 'top';
  });
}

export default async function Home() {
  const views = await getViews();
  const currentView = views.find((view) => view.id === 'front') ?? views[0];

  if (!currentView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
        <p role="status">No hay vistas disponibles para mostrar.</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <img
        src={currentView.base_image_url}
        alt={viewAltText[currentView.id]}
        className="absolute inset-0 h-full w-full object-cover"
        data-testid="showroom-base-image"
      />
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      <section className="relative z-10 flex min-h-screen items-end p-6 sm:p-10">
        <div className="max-w-md rounded-lg bg-black/55 p-5 backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">Parcela</p>
          <h1 className="mt-2 text-3xl font-semibold">Descubre tu próximo terreno</h1>
          <p className="mt-2 text-white/80">
            Explora las vistas del proyecto y conoce cada espacio.
          </p>
        </div>
      </section>
    </main>
  );
}
