import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BackToShowroomLink() {
  return (
    <Link
      href="/"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'text-white/80 hover:bg-white/10 hover:text-white'
      )}
    >
      <ArrowLeft className="mr-2 size-4" />
      Volver al showroom
    </Link>
  );
}
