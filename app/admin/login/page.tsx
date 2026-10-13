'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { login, type LoginState } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

const initialState: LoginState = { message: null };

// En mobile: 44px de alto y 16px de fuente (evita el zoom automático de iOS).
const inputClass =
  'flex h-11 w-full rounded-md border border-border bg-input/30 px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9 sm:text-sm';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center p-4 sm:p-6">
      <Link
        href="/"
        className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:left-6 sm:top-[calc(env(safe-area-inset-top)+1.5rem)]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Volver al showroom
      </Link>
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Acceso al panel</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        {state.message && (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
