import { notFound } from 'next/navigation';

import { updateLot } from '@/app/admin/actions';
import { LotForm } from '@/components/admin/LotForm';
import { getLotByIdForAdmin } from '@/lib/admin/lot-data';
import { lotFormSchema, lotIdSchema } from '@/lib/validations/lot.schema';

interface EditLotPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Editar lote',
};

export default async function EditLotPage({ params }: EditLotPageProps) {
  const { id } = await params;

  if (!lotIdSchema.safeParse(id).success) {
    notFound();
  }

  const lot = await getLotByIdForAdmin(id);

  if (!lot) {
    notFound();
  }

  const defaults = lotFormSchema.parse(lot);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar {lot.name}</h1>
      <LotForm mode="edit" lotId={id} submit={updateLot} defaultValues={defaults} />
    </div>
  );
}
