import { exampleResponse, sampleText } from "@/components/landing/examples";
import { Hero } from "@/components/landing/hero";
import { Capabilities, Closing, HowItWorks, Problem } from "@/components/landing/sections";
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
    <main className="bg-paper">
      <Hero />
      <Problem />
      <HowItWorks />
      <Showcase examples={examples} />
      <Capabilities />
      <Closing />
    </main>
  );
}
