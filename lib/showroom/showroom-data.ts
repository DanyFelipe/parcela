import { createClient } from '@/lib/supabase/server';
import type { ShowroomView } from '@/lib/store/showroom.store';
import type { TransitionUrls } from '@/lib/transitions/transition-resolver';

export interface ShowroomViewData {
  id: ShowroomView;
  display_order: number;
  base_image_url: string;
  alt_image_url: string | null;
}

export type LotStatus = 'available' | 'reserved' | 'sold';

export interface LotData {
  id: string;
  name: string;
  price: number | null;
  status: LotStatus;
  surface_area: number | null;
}

export interface LotHotspotData {
  id: string;
  lot_id: string;
  view_id: ShowroomView;
  hotspot_x: number;
  hotspot_y: number;
}

export interface ShowroomData {
  views: ShowroomViewData[];
  transitionUrls: TransitionUrls;
  lots: LotData[];
  lotHotspots: LotHotspotData[];
}

function isValidViewId(id: string): id is ShowroomView {
  return id === 'front' || id === 'rear' || id === 'top';
}

function isValidLotStatus(status: string): status is LotStatus {
  return status === 'available' || status === 'reserved' || status === 'sold';
}

export async function getShowroomData(): Promise<ShowroomData> {
  const supabase = await createClient();
  const [
    { data: views, error: viewsError },
    { data: transitions, error: transitionsError },
    { data: lots, error: lotsError },
    { data: lotHotspots, error: lotHotspotsError },
  ] = await Promise.all([
    supabase
      .from('views')
      .select('id, display_order, base_image_url, alt_image_url')
      .order('display_order', { ascending: true }),
    supabase.from('view_transitions').select('from_view_id, to_view_id, video_url'),
    supabase.from('lots').select('id, name, price, status, surface_area'),
    supabase.from('lot_hotspots').select('id, lot_id, view_id, hotspot_x, hotspot_y'),
  ]);

  if (viewsError || transitionsError || lotsError || lotHotspotsError) {
    console.error('Error loading showroom data', {
      viewsError,
      transitionsError,
      lotsError,
      lotHotspotsError,
    });
    throw new Error('No se pudo cargar la experiencia del terreno.');
  }

  const validViews = (views ?? []).filter((view): view is ShowroomViewData => {
    return isValidViewId(view.id);
  });

  const transitionUrls: TransitionUrls = {};
  for (const transition of transitions ?? []) {
    if (isValidViewId(transition.from_view_id) && isValidViewId(transition.to_view_id)) {
      transitionUrls[`${transition.from_view_id}->${transition.to_view_id}`] = transition.video_url;
    }
  }

  const validLots = (lots ?? []).filter((lot): lot is LotData => {
    return (
      typeof lot.id === 'string' && typeof lot.name === 'string' && isValidLotStatus(lot.status)
    );
  });

  const validLotHotspots = (lotHotspots ?? []).filter((hotspot): hotspot is LotHotspotData => {
    return (
      typeof hotspot.id === 'string' &&
      typeof hotspot.lot_id === 'string' &&
      isValidViewId(hotspot.view_id) &&
      typeof hotspot.hotspot_x === 'number' &&
      typeof hotspot.hotspot_y === 'number'
    );
  });

  return {
    views: validViews,
    transitionUrls,
    lots: validLots,
    lotHotspots: validLotHotspots,
  };
}
