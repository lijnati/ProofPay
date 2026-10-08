import { exampleResponse, sampleText } from "@/components/landing/examples";
import { Hero } from "@/components/landing/hero";
import { Capabilities, FinalCta, Footer, HowItWorks, Problem } from "@/components/landing/sections";
import { Showcase, type ShowcaseExample } from "@/components/landing/showcase";
import { SiteHeader } from "@/components/site-header";

const SHOWCASE: { id: string; tab: string }[] = [
  { id: "substituted-account", tab: "Changed bank details" },
  { id: "legit-northwind", tab: "Routine invoice" },
  { id: "unknown-supplier", tab: "Unknown supplier" },
];

export default function LandingPage() {
  const examples: ShowcaseExample[] = SHOWCASE.map(({ id, tab }) => ({
    id,
    tab,
    text: sampleText(id),
    data: exampleResponse(id),
  }));
  return (
    <>
      <SiteHeader variant="marketing" />
      <main>
        <Hero />
        <Showcase examples={examples} />
        <Problem />
        <HowItWorks />
        <Capabilities />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
