import { SAMPLES } from "../src/fixtures/samples";

const base = process.argv[2] ?? "http://localhost:3100";
for (const s of SAMPLES) {
  const t = Date.now();
  const r = await fetch(`${base}/api/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: s.text }),
  });
  const j = await r.json();
  console.log(r.status, s.id.padEnd(22), j.extractionMode, j.result?.verdict, `expected ${s.expectedVerdict}`, `${Date.now() - t}ms`);
}
