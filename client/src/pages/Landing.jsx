import Hero from "../components/Hero/Hero";
import SkinAnalysis from "../components/Hero/SkinAnalysis";
import VirtualWardrobe from "../components/Hero/VirtualWardrobe";
import AIChatHero from "../components/Hero/AIChatHero";
export default function Landing() {
  return (
    <main className="page-shell">
      <Hero />
      <SkinAnalysis />
      <VirtualWardrobe />
      <AIChatHero />
    </main>
  );
}