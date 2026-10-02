import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { LotTechnicalPlan } from '@/components/showroom/LotTechnicalPlan';

describe('LotTechnicalPlan', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the technical plan image with a descriptive alt', () => {
    render(<LotTechnicalPlan imageUrl="https://placehold.co/plan.webp" lotName="Lote A-01" />);

    const image = screen.getByRole('img', { name: 'Plano técnico de Lote A-01' });
    expect(image).toHaveAttribute('src', 'https://placehold.co/plan.webp');
    expect(screen.getByRole('region', { name: 'Plano técnico' })).toHaveClass('glass-panel');
  });

  it('renders the section heading', () => {
    render(<LotTechnicalPlan imageUrl="https://placehold.co/plan.webp" lotName="Lote A-01" />);

    expect(screen.getByRole('heading', { name: 'Plano técnico' })).toBeInTheDocument();
  });
});
