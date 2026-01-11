import Hero from '@/components/Hero';
import AboutSection from '@/components/sections/AboutSection';
import EventsSection from '@/components/sections/EventsSection';
import FunGamesBanner from '@/components/sections/FunGamesBanner';
import WhatsAppCTA from '@/components/sections/WhatsAppCTA';

export default function Home() {
  return (
    <>
      <Hero />
      <AboutSection />
      <FunGamesBanner />
      <EventsSection />
      <WhatsAppCTA />
    </>
  );
}
