import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
}));

vi.mock('@/app/admin/actions', () => ({
  login: mocks.login,
}));

import AdminLoginPage from '@/app/admin/login/page';

describe('AdminLoginPage', () => {
  beforeEach(() => {
    mocks.login.mockReset();
  });

  afterEach(() => cleanup());

  it('renders the login form', () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('shows the message returned by the action and re-enables the button', async () => {
    mocks.login.mockResolvedValue({
      message: 'No se pudo iniciar sesión. Revisá el correo y la contraseña.',
    });

    render(<AdminLoginPage />);
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form')!);

    expect(
      await screen.findByText('No se pudo iniciar sesión. Revisá el correo y la contraseña.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });
});
