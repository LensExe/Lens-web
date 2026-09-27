import { lazy, Suspense } from "react";
import { Hero } from "@/components/landing/Hero";
import { BrandStrip } from "@/components/landing/BrandStrip";
import { FeaturedPhotographers } from "@/components/landing/FeaturedPhotographers";
import { Statement } from "@/components/landing/Statement";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { StyleCategories } from "@/components/landing/StyleCategories";
import { FooterCTA } from "@/components/landing/FooterCTA";

// Below-the-fold, motion/3rd-party-heavy sections are code-split so their
// component code stays out of the initial bundle.
const lazySection = (load: () => Promise<Record<string, React.ComponentType>>, key: string) =>
  lazy(() => load().then((m) => ({ default: m[key] })));

const StatsStrip = lazySection(() => import("@/components/landing/StatsStrip"), "StatsStrip");
const GalleryMasonry = lazySection(() => import("@/components/landing/GalleryMasonry"), "GalleryMasonry");
const StyleShowcase = lazySection(() => import("@/components/landing/StyleShowcase"), "StyleShowcase");

const Spacer = ({ h }: { h: number }) => <div style={{ height: h }} aria-hidden />;

export function Landing() {
  return (
    <>
      <Hero />
      <BrandStrip />
      <Suspense fallback={<Spacer h={220} />}>
        <StatsStrip />
      </Suspense>
      <FeaturedPhotographers />
      <Suspense fallback={<Spacer h={600} />}>
        <GalleryMasonry />
      </Suspense>
      <Statement />
      <HowItWorks />
      <StyleCategories />
      <Suspense fallback={<Spacer h={640} />}>
        <StyleShowcase />
      </Suspense>
      <FooterCTA />
    </>
  );
}
