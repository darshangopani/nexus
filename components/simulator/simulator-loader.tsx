'use client';

import dynamic from 'next/dynamic';

const SimulatorApp = dynamic(() => import('./simulator-app'), {
  ssr: false,
  loading: () => <div className="h-svh w-screen bg-black" />,
});

export function SimulatorLoader() {
  return <SimulatorApp />;
}
