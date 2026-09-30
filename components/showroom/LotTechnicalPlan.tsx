interface LotTechnicalPlanProps {
  imageUrl: string;
  lotName: string;
}

export function LotTechnicalPlan({ imageUrl, lotName }: LotTechnicalPlanProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-white/60">Plano técnico</h2>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`Plano técnico de ${lotName}`} className="w-full object-contain" />
      </div>
    </div>
  );
}
