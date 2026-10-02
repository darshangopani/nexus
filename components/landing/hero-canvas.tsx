'use client';

import dynamic from 'next/dynamic';

const GargantuaBlackHole = dynamic(
  () => import('@/components/GargantuaBlackHole').then((m) => m.GargantuaBlackHole),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-black" aria-hidden="true" />,
  },
);

export function HeroCanvas() {
  return (
    <div className="fixed inset-0 z-0 bg-black" aria-hidden="true">
      <GargantuaBlackHole />
    </div>
  );
}
