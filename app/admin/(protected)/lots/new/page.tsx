import { createLot } from '@/app/admin/actions';
import { LotForm } from '@/components/admin/LotForm';

export const metadata = {
  title: 'Nuevo lote',
};

export default function NewLotPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo lote</h1>
      <LotForm mode="create" submit={createLot} />
    </div>
  );
}
