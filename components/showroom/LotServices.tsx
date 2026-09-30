import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LotServicesProps {
  water: boolean;
  electricity: boolean;
  sewage: boolean;
}

export function LotServices({ water, electricity, sewage }: LotServicesProps) {
  return (
    <>
      <h3 className="mb-3 text-sm font-medium text-white/60">Servicios disponibles</h3>
      <ul className="grid gap-3 sm:grid-cols-3">
        <ServiceItem active={water} label="Agua" />
        <ServiceItem active={electricity} label="Electricidad" />
        <ServiceItem active={sewage} label="Cloacas" />
      </ul>
    </>
  );
}

function ServiceItem({ active, label }: { active: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
      {active ? (
        <Check className="size-4 text-emerald-400" aria-hidden="true" />
      ) : (
        <X className="size-4 text-white/40" aria-hidden="true" />
      )}
      <span className={cn('text-sm', active ? 'text-white' : 'text-white/50')}>{label}</span>
    </li>
  );
}
