import { Hero } from "@/components/landing/Hero";
import { FeaturedPhotographers } from "@/components/landing/FeaturedPhotographers";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { StyleCategories } from "@/components/landing/StyleCategories";
import { FooterCTA } from "@/components/landing/FooterCTA";
import { StatsStrip } from "@/components/landing/StatsStrip";

export function Landing() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <StyleCategories />
      <FeaturedPhotographers />
      <HowItWorks />
      <FooterCTA />
    </>
  );
}
