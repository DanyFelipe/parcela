import { legalStatusLabels, type LotLegalStatus } from '@/lib/showroom/lot-status';

interface LotSpecsProps {
  orientation: string | null;
  soilType: string | null;
  legalStatus: LotLegalStatus | null;
  registryNumber: string | null;
  encumbrances: string | null;
}

export function LotSpecs({
  orientation,
  soilType,
  legalStatus,
  registryNumber,
  encumbrances,
}: LotSpecsProps) {
  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6" aria-labelledby="lot-specs-heading">
      <h2 id="lot-specs-heading" className="mb-4 text-sm font-medium text-muted-foreground">
        Ficha técnica
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        <SpecItem label="Orientación" value={orientation ?? 'No especificada'} />
        <SpecItem label="Tipo de suelo" value={soilType ?? 'No especificado'} />
        <SpecItem
          label="Estado legal"
          value={legalStatus ? legalStatusLabels[legalStatus] : 'No especificado'}
        />
        <SpecItem label="Número de registro" value={registryNumber ?? 'No especificado'} />
      </dl>

      {encumbrances && (
        <div className="mt-4 rounded-xl border border-panel-border bg-foreground/[0.025] p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Gravámenes y observaciones</h3>
          <p className="mt-2 text-foreground/85">{encumbrances}</p>
        </div>
      )}
    </section>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-panel-border bg-foreground/[0.025] p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
