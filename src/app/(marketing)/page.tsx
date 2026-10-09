import { exampleResponse, sampleText } from "@/components/landing/examples";
import { Hero, Nav } from "@/components/landing/hero";
import { Capabilities, Closing, Footer, HowItWorks, Problem } from "@/components/landing/sections";
import { Showcase, type ShowcaseExample } from "@/components/landing/showcase";

const SHOWCASE: { id: string; tab: string }[] = [
  { id: "substituted-account", tab: "Held" },
  { id: "unknown-supplier", tab: "Needs review" },
  { id: "legit-northwind", tab: "No mismatch" },
];

export default function LandingPage() {
  const examples: ShowcaseExample[] = SHOWCASE.map(({ id, tab }) => ({
    id,
    tab,
    text: sampleText(id),
    data: exampleResponse(id),
  }));
  return (
    <div className="bg-paper text-ink">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Showcase examples={examples} />
        <Capabilities />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
