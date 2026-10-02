/**
 * Decide how the persistent "volver" button should navigate.
 *
 * Next.js tracks the position in the session history via `history.state.idx`.
 * When it is greater than zero there is somewhere to go back to; otherwise the
 * visitor landed directly here and we fall back to the showroom home.
 */
export function resolveBackNavigation(historyState: unknown): 'back' | 'home' {
  const index = (historyState as { idx?: unknown } | null | undefined)?.idx;

  return typeof index === 'number' && index > 0 ? 'back' : 'home';
}
