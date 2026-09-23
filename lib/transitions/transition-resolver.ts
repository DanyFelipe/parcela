import type { ShowroomView } from '@/lib/store/showroom.store';

export type TransitionUrls = Partial<Record<string, string>>;

const validTransitionPairs: ReadonlySet<string> = new Set([
  'front->rear',
  'rear->front',
  'front->top',
  'top->front',
]);

export function getTransitionKey(fromView: ShowroomView, toView: ShowroomView): string {
  return `${fromView}->${toView}`;
}

export function resolveTransitionVideoUrl(
  fromView: ShowroomView,
  toView: ShowroomView,
  transitionUrls: TransitionUrls
): string | null {
  if (fromView === toView) {
    return null;
  }

  const transitionKey = getTransitionKey(fromView, toView);

  if (!validTransitionPairs.has(transitionKey)) {
    return null;
  }

  const videoUrl = transitionUrls[transitionKey]?.trim();
  return videoUrl || null;
}
