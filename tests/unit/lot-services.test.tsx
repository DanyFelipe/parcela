import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { LotServices } from '@/components/showroom/LotServices';

describe('LotServices', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all three service labels', () => {
    render(<LotServices water electricity sewage />);

    expect(screen.getByText('Agua')).toBeInTheDocument();
    expect(screen.getByText('Electricidad')).toBeInTheDocument();
    expect(screen.getByText('Cloacas')).toBeInTheDocument();
  });

  it('marks active services as enabled', () => {
    render(<LotServices water electricity sewage={false} />);

    expect(screen.getByText('Agua')).toHaveClass('text-foreground');
    expect(screen.getByText('Electricidad')).toHaveClass('text-foreground');
    expect(screen.getByText('Cloacas')).toHaveClass('text-muted-foreground');
  });

  it('renders the section heading', () => {
    render(<LotServices water={false} electricity={false} sewage={false} />);

    expect(screen.getByRole('region', { name: 'Servicios disponibles' })).toHaveClass(
      'glass-panel'
    );
  });
});
