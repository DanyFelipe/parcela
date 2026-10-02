interface LotTechnicalPlanProps {
  imageUrl: string;
  lotName: string;
}

export function LotTechnicalPlan({ imageUrl, lotName }: LotTechnicalPlanProps) {
  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-6" aria-labelledby="lot-plan-heading">
      <h2 id="lot-plan-heading" className="mb-4 text-sm font-medium text-muted-foreground">
        Plano técnico
      </h2>
      <div className="overflow-hidden rounded-xl border border-panel-border bg-background/80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`Plano técnico de ${lotName}`} className="w-full object-contain" />
      </div>
    </section>
  );
}
