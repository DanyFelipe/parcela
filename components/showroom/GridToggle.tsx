'use client';

import { Grid3x3 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface GridToggleProps {
  showGrid: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function GridToggle({ showGrid, onToggle, disabled }: GridToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label={showGrid ? 'Ocultar división de lotes' : 'Mostrar división de lotes'}
      title={showGrid ? 'Ocultar grid' : 'Mostrar grid'}
      aria-pressed={showGrid}
      disabled={disabled}
      onClick={onToggle}
      className="size-11 rounded-full text-foreground hover:bg-foreground/10"
      data-testid="grid-toggle"
    >
      <Grid3x3 aria-hidden="true" size={20} />
    </Button>
  );
}
