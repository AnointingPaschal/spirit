import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { WalletsSection } from '../components/WalletsSection';
import { CodeShowcase } from '../components/CodeShowcase';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col noise">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <WalletsSection />
        <CodeShowcase />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
