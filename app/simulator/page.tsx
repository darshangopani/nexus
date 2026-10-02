import type { Metadata } from 'next';
import { SimulatorLoader } from '@/components/simulator/simulator-loader';

export const metadata: Metadata = {
  title: 'Gargantua Simulator | EVENT HORIZON AI',
  description: 'Real-time Schwarzschild black hole simulation with gravitational lensing and Doppler beaming.',
};

export default function SimulatorPage() {
  return <SimulatorLoader />;
}
