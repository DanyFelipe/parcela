import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { BackToShowroomLink } from '@/components/showroom/BackToShowroomLink';

describe('BackToShowroomLink', () => {
  afterEach(() => {
    cleanup();
  });

  it('links to the showroom home page', () => {
    render(<BackToShowroomLink />);

    const link = screen.getByRole('link', { name: 'Volver al showroom' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the arrow icon and label', () => {
    render(<BackToShowroomLink />);

    expect(screen.getByText('Volver al showroom')).toBeInTheDocument();
  });
});
