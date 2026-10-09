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

/**
 * Clips que la vista actual puede disparar. Se usa para precargarlos antes de que
 * el visitante haga clic (ver `04-coding-standards.md` §6).
 */
export function getPreloadableTransitionUrls(
  fromView: ShowroomView,
  transitionUrls: TransitionUrls
): string[] {
  const urls: string[] = [];

  for (const transitionKey of validTransitionPairs) {
    if (!transitionKey.startsWith(`${fromView}->`)) {
      continue;
    }

    const videoUrl = transitionUrls[transitionKey]?.trim();

    if (videoUrl) {
      urls.push(videoUrl);
    }
  }

  return urls;
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
