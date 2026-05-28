'use client';
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { WalletsSection } from '../components/WalletsSection';
import { CodeShowcase } from '../components/CodeShowcase';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';
import { WalletConnectModal } from '../components/WalletConnectModal';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col noise">
      <Navbar onConnectClick={() => setModalOpen(true)} />
      <main className="flex-1">
        <Hero onConnectClick={() => setModalOpen(true)} />
        <Features />
        <WalletsSection onConnectClick={() => setModalOpen(true)} />
        <CodeShowcase />
        <CTA onConnectClick={() => setModalOpen(true)} />
      </main>
      <Footer />

      <WalletConnectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
