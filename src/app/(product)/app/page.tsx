import type { Metadata } from "next";
import { VerifyConsole } from "@/components/verify-console";
import { SAMPLES } from "@/fixtures/samples";

export const metadata: Metadata = {
  title: "Verification console",
  description: "Paste a payment request and compare it with trusted supplier records.",
};

export default function AppPage() {
  const samples = SAMPLES.map(({ id, label, scenario, text }) => ({ id, label, scenario, text }));
  return <VerifyConsole samples={samples} />;
}
