type LotStatus = 'available' | 'reserved' | 'sold';

const statusConfig: Record<LotStatus, { label: string; className: string }> = {
  available: {
    label: 'Disponible',
    className: 'bg-status-available/10 text-status-available',
  },
  reserved: {
    label: 'Reservado',
    className: 'bg-status-reserved/10 text-status-reserved',
  },
  sold: {
    label: 'Vendido',
    className: 'bg-status-sold/10 text-status-sold',
  },
};

interface StatusBadgeProps {
  status: LotStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
