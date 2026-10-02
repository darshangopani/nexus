import { HeroCanvas } from '@/components/landing/hero-canvas';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { About } from '@/components/landing/about';
import { Faq } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <>
      <HeroCanvas />
      <Navbar />
      <main>
        <Hero />
        <div className="relative bg-background/90 backdrop-blur-md">
          <Features />
          <HowItWorks />
          <About />
          <Faq />
          <Footer />
        </div>
      </main>
    </>
  );
}
