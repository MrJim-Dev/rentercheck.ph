import { Navigation } from "@/components/landingpage/navigation"
import { HeroSection } from "@/components/landingpage/hero-section"
import { FeaturesSection } from "@/components/landingpage/features-section"
import { HowItWorks } from "@/components/landingpage/how-it-works"
import { CTASection } from "@/components/landingpage/cta-section"
import { Footer } from "@/components/landingpage/footer"

export default function Home() {
  return (
      <main className="overflow-hidden bg-background">
        <Navigation />
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
        <Footer />
      </main>
  )
}
