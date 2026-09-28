import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { GridToggle } from '@/components/showroom/GridToggle';

describe('GridToggle', () => {
  const onToggle = vi.fn();

  afterEach(() => {
    cleanup();
    onToggle.mockReset();
  });

  it('renders with aria-pressed true when grid is visible', () => {
    render(<GridToggle showGrid onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Ocultar división de lotes' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders with aria-pressed false when grid is hidden', () => {
    render(<GridToggle showGrid={false} onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Mostrar división de lotes' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onToggle when clicked', () => {
    render(<GridToggle showGrid onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId('grid-toggle'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
