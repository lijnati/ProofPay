import { VerifyConsole } from "@/components/verify-console";
import { SAMPLES } from "@/fixtures/samples";

export default function Home() {
  const samples = SAMPLES.map(({ id, label, scenario, text }) => ({ id, label, scenario, text }));
  return <VerifyConsole samples={samples} />;
}
