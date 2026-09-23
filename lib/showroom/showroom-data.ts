import { createClient } from '@/lib/supabase/server';
import type { ShowroomView } from '@/lib/store/showroom.store';
import type { TransitionUrls } from '@/lib/transitions/transition-resolver';

export interface ShowroomViewData {
  id: ShowroomView;
  display_order: number;
  base_image_url: string;
  alt_image_url: string | null;
}

export interface ShowroomData {
  views: ShowroomViewData[];
  transitionUrls: TransitionUrls;
}

export async function getShowroomData(): Promise<ShowroomData> {
  const supabase = await createClient();
  const [{ data: views, error: viewsError }, { data: transitions, error: transitionsError }] =
    await Promise.all([
      supabase
        .from('views')
        .select('id, display_order, base_image_url, alt_image_url')
        .order('display_order', { ascending: true }),
      supabase.from('view_transitions').select('from_view_id, to_view_id, video_url'),
    ]);

  if (viewsError || transitionsError) {
    console.error('Error loading showroom data', { viewsError, transitionsError });
    throw new Error('No se pudo cargar la experiencia del terreno.');
  }

  const validViews = (views ?? []).filter((view): view is ShowroomViewData => {
    return view.id === 'front' || view.id === 'rear' || view.id === 'top';
  });
  const transitionUrls: TransitionUrls = {};

  for (const transition of transitions ?? []) {
    if (
      (transition.from_view_id === 'front' ||
        transition.from_view_id === 'rear' ||
        transition.from_view_id === 'top') &&
      (transition.to_view_id === 'front' ||
        transition.to_view_id === 'rear' ||
        transition.to_view_id === 'top')
    ) {
      transitionUrls[`${transition.from_view_id}->${transition.to_view_id}`] = transition.video_url;
    }
  }

  return { views: validViews, transitionUrls };
}
