import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FeatureInfoPopover } from '@/components/showroom/FeatureInfoPopover';

const baseFeature = {
  id: 'fs-1',
  title: 'Caseta de ventas',
  description: 'Atención de lunes a sábado.',
  icon: 'home',
};

describe('FeatureInfoPopover', () => {
  const onClose = vi.fn();

  afterEach(() => {
    document.body.innerHTML = '';
    onClose.mockReset();
  });

  it('does not render when no feature is active', () => {
    render(<FeatureInfoPopover feature={null} onClose={onClose} />);

    expect(screen.queryByTestId('feature-info-popover')).not.toBeInTheDocument();
  });

  it('renders title, description and icon when a feature is active', () => {
    render(<FeatureInfoPopover feature={baseFeature} onClose={onClose} />);

    expect(screen.getByTestId('feature-info-popover')).toBeInTheDocument();
    expect(
      screen.getByTestId('feature-info-popover').querySelector('.glass-panel')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Caseta de ventas' })).toBeInTheDocument();
    expect(screen.getByText('Atención de lunes a sábado.')).toBeInTheDocument();
  });

  it('exposes the dialog with correct ARIA attributes', () => {
    render(<FeatureInfoPopover feature={baseFeature} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'feature-title-fs-1');
  });

  it('calls onClose when clicking the close button', () => {
    render(<FeatureInfoPopover feature={baseFeature} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar información' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
