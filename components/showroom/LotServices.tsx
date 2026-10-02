import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LotServicesProps {
  water: boolean;
  electricity: boolean;
  sewage: boolean;
}

export function LotServices({ water, electricity, sewage }: LotServicesProps) {
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6" aria-labelledby="lot-services-heading">
      <h2 id="lot-services-heading" className="mb-4 text-sm font-medium text-muted-foreground">
        Servicios disponibles
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        <ServiceItem active={water} label="Agua" />
        <ServiceItem active={electricity} label="Electricidad" />
        <ServiceItem active={sewage} label="Cloacas" />
      </ul>
    </section>
  );
}

function ServiceItem({ active, label }: { active: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-xl border border-panel-border bg-foreground/[0.025] p-3">
      {active ? (
        <Check className="size-4 text-status-available" aria-hidden="true" />
      ) : (
        <X className="size-4 text-muted-foreground/60" aria-hidden="true" />
      )}
      <span className={cn('text-sm', active ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </li>
  );
}
