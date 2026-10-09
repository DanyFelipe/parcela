import { createClient } from '@/lib/supabase/server';

export interface AdminView {
  id: string;
  display_order: number;
  base_image_url: string;
  alt_image_url: string | null;
  created_at: string;
}

export async function getTopViewForAdmin(): Promise<AdminView | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('views').select('*').eq('id', 'top').single();

  if (error || !data) {
    return null;
  }

  return data as AdminView;
}

export interface AdminLotHotspot {
  hotspot_x: number;
  hotspot_y: number;
}

export async function getLotHotspotForAdmin(
  lotId: string,
  viewId: string
): Promise<AdminLotHotspot | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lot_hotspots')
    .select('hotspot_x, hotspot_y')
    .eq('lot_id', lotId)
    .eq('view_id', viewId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AdminLotHotspot;
}
