import { BetaBanner } from "@/components/landingpage/beta-banner"
import { CTASection } from "@/components/landingpage/cta-section"
import { FeaturesSection } from "@/components/landingpage/features-section"
import { Footer } from "@/components/landingpage/footer"
import { HeroSection } from "@/components/landingpage/hero-section"
import { HowItWorks } from "@/components/landingpage/how-it-works"
import { Navigation } from "@/components/landingpage/navigation"

export default function Home() {
  return (
    <main className="overflow-hidden bg-background">
      <BetaBanner />
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
      <Footer />
    </main>
  )
}
