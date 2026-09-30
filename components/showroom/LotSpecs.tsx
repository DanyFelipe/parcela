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
    <>
      <h2 className="mb-3 text-sm font-medium text-white/60">Ficha técnica</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <SpecItem label="Orientación" value={orientation ?? 'No especificada'} />
        <SpecItem label="Tipo de suelo" value={soilType ?? 'No especificado'} />
        <SpecItem
          label="Estado legal"
          value={legalStatus ? legalStatusLabels[legalStatus] : 'No especificado'}
        />
        <SpecItem label="Número de registro" value={registryNumber ?? 'No especificado'} />
      </dl>

      {encumbrances && (
        <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-medium text-white/60">Gravámenes y observaciones</h3>
          <p className="mt-2 text-white/80">{encumbrances}</p>
        </div>
      )}
    </>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <dt className="text-xs text-white/50">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
