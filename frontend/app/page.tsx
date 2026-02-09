import Hero from '@/components/Hero';
import AboutSection from '@/components/sections/AboutSection';
import EventsSection from '@/components/sections/EventsSection';
import FunGamesBanner from '@/components/sections/FunGamesBanner';
import WhatsAppCTA from '@/components/sections/WhatsAppCTA';

export default function Home() {
  return (
    <>
      <Hero />
      <div className="bg-[#f8f5ff]">
        <AboutSection />
        <FunGamesBanner />
        <EventsSection />
        <WhatsAppCTA />
      </div>
    </>
  );
}
