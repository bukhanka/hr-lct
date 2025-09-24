import { HeroSection } from "@/components/landing/HeroSection";
import { RoleCards } from "@/components/landing/RoleCards";
import { FeaturesMatrix } from "@/components/landing/FeaturesMatrix";
import { AiCopilotSection } from "@/components/landing/AiCopilotSection";
import { TechStackSection } from "@/components/landing/TechStackSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050514] via-[#0b0924] to-[#050514] text-white">
      <HeroSection />
      <RoleCards />
      <FeaturesMatrix />
      <AiCopilotSection />
      <TechStackSection />
    </div>
  );
}
