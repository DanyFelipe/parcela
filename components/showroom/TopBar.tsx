'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { ArrowLeft, Menu as MenuIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { useShowroomStore } from '@/lib/store/showroom.store';
import { resolveBackNavigation } from '@/lib/navigation';

const SHOWROOM_PATH = '/';

const controlClassName =
  'pointer-events-auto glass-panel inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const menuItemClassName =
  'flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-foreground outline-none select-none data-[highlighted]:bg-foreground/5';

/**
 * Persistent top bar for the whole app: back navigation on the left and a
 * placeholder menu on the right. It floats over the showroom render and the
 * lot page alike.
 */
export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const currentView = useShowroomStore((state) => state.currentView);
  const requestFront = useShowroomStore((state) => state.requestFront);

  function handleBack(): void {
    if (pathname === SHOWROOM_PATH && currentView !== 'front') {
      requestFront();
      return;
    }

    if (resolveBackNavigation(window.history.state) === 'back') {
      router.back();
      return;
    }

    router.push('/');
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-start gap-2 p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:p-6 sm:pt-[calc(env(safe-area-inset-top)+1rem)]">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Volver"
        data-testid="top-bar-back"
        className={controlClassName}
      >
        <ArrowLeft size={20} aria-hidden="true" />
      </button>

      <MenuPrimitive.Root>
        <MenuPrimitive.Trigger
          aria-label="Abrir menú"
          data-testid="top-bar-menu-trigger"
          className={controlClassName}
        >
          <MenuIcon size={20} aria-hidden="true" />
        </MenuPrimitive.Trigger>
        <MenuPrimitive.Portal>
          <MenuPrimitive.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
            <MenuPrimitive.Popup className="glass-panel min-w-40 rounded-xl p-1 text-foreground">
              <MenuPrimitive.Item className={menuItemClassName} onClick={() => router.push('/')}>
                Inicio
              </MenuPrimitive.Item>
              <MenuPrimitive.Separator className="my-1 h-px bg-panel-border" />
              <MenuPrimitive.Item className={menuItemClassName} onClick={handleBack}>
                Volver
              </MenuPrimitive.Item>
            </MenuPrimitive.Popup>
          </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
      </MenuPrimitive.Root>
    </div>
  );
}
