/**
 * The landing page's signature: a mesh-gradient field cut by one horizontal
 * line, with the lower band shifted out of line — the logo at the scale of a
 * page. `split` is the fraction of the height where the cut sits.
 */
export function SplitField({ split = 0.62, tone = "dark" }: { split?: number; tone?: "dark" }) {
  const upperPct = split * 100;
  const scaleUp = 100 / split; // inner field keeps the full section height
  const scaleDown = 100 / (1 - split);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" data-tone={tone}>
      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: `${upperPct}%` }}>
        <div className="mesh mesh-drift absolute inset-x-0 top-0" style={{ height: `${scaleUp}%` }} />
      </div>
      <div className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: `calc(${100 - upperPct}% - 2px)` }}>
        <div
          className="split-lower mesh mesh-drift absolute inset-x-0 bottom-0 [--split-offset:28px] sm:[--split-offset:56px]"
          style={{ height: `${scaleDown}%` }}
        />
      </div>
      <div className="mesh-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="mesh-grain absolute inset-0" />
    </div>
  );
}
