import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { LotSpecs } from '@/components/showroom/LotSpecs';

describe('LotSpecs', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all spec labels and values', () => {
    render(
      <LotSpecs
        orientation="Norte"
        soilType="Arcilloso"
        legalStatus="titled"
        registryNumber="R-12345"
        encumbrances={null}
      />
    );

    expect(screen.getByRole('region', { name: 'Ficha técnica' })).toHaveClass('glass-panel');
    expect(screen.getByText('Orientación').closest('div')).toHaveTextContent('Norte');
    expect(screen.getByText('Tipo de suelo').closest('div')).toHaveTextContent('Arcilloso');
    expect(screen.getByText('Estado legal').closest('div')).toHaveTextContent('Con escritura');
    expect(screen.getByText('Número de registro').closest('div')).toHaveTextContent('R-12345');
  });

  it('shows fallbacks when spec values are null', () => {
    render(
      <LotSpecs
        orientation={null}
        soilType={null}
        legalStatus={null}
        registryNumber={null}
        encumbrances={null}
      />
    );

    expect(screen.getByText('Orientación').closest('div')).toHaveTextContent('No especificada');
    expect(screen.getByText('Tipo de suelo').closest('div')).toHaveTextContent('No especificado');
    expect(screen.getByText('Estado legal').closest('div')).toHaveTextContent('No especificado');
    expect(screen.getByText('Número de registro').closest('div')).toHaveTextContent(
      'No especificado'
    );
  });

  it('renders encumbrances section when provided', () => {
    render(
      <LotSpecs
        orientation="Norte"
        soilType="Arcilloso"
        legalStatus="titled"
        registryNumber="R-12345"
        encumbrances="Gravamen registrado a favor del Banco X."
      />
    );

    expect(screen.getByText('Gravámenes y observaciones')).toBeInTheDocument();
    expect(screen.getByText('Gravamen registrado a favor del Banco X.')).toBeInTheDocument();
  });

  it('does not render encumbrances section when null', () => {
    render(
      <LotSpecs
        orientation="Norte"
        soilType="Arcilloso"
        legalStatus="titled"
        registryNumber="R-12345"
        encumbrances={null}
      />
    );

    expect(screen.queryByText('Gravámenes y observaciones')).not.toBeInTheDocument();
  });
});
