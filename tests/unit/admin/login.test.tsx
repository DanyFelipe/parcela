import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithPassword: mocks.signInWithPassword } }),
}));

import AdminLoginPage from '@/app/admin/login/page';

describe('AdminLoginPage', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
    mocks.signInWithPassword.mockReset();
  });

  afterEach(() => cleanup());

  it('refreshes the authenticated route after a successful login', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: ' admin@example.com ' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form')!);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin'));
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret',
    });
  });

  it('shows a safe message when credentials are rejected and allows retry', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: new Error('Invalid login credentials') });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form')!);

    expect(
      await screen.findByText('No se pudo iniciar sesión. Revisá el correo y la contraseña.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
