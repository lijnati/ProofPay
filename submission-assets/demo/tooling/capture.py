"""Record real ProofPay interactions (live model) as timestamped JPEG frames.

Each take -> takes/<name>/NNNNN.jpg + frames.txt (ffconcat with per-frame durations).
Usage: python capture.py BASE_URL take1 [take2 ...]
"""
import asyncio, base64, json, os, sys, time
from playwright.async_api import async_playwright

BASE = sys.argv[1].rstrip("/")
WANT = sys.argv[2:]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "takes")
VW, VH, DSF = 1600, 900, 2

CURSOR_JS = r"""
(() => {
  const mk = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.3 L11.3 13.7 L17.5 13.7 Z" fill="#17181a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {position:'fixed', left:'0', top:'0', zIndex:'2147483647', pointerEvents:'none',
      transform:'translate(-100px,-100px)', transition:'none'});
    const r = document.createElement('div');
    r.id = '__ring';
    Object.assign(r.style, {position:'fixed', left:'0', top:'0', width:'34px', height:'34px', marginLeft:'-17px', marginTop:'-17px',
      borderRadius:'50%', border:'2px solid #2140d4', opacity:'0', zIndex:'2147483646', pointerEvents:'none'});
    document.documentElement.appendChild(r);
    document.documentElement.appendChild(c);
    const p = window.__curPos || {x:-100, y:-100};
    c.style.transform = `translate(${p.x - 4}px, ${p.y - 2}px)`;
  };
  document.addEventListener('mousemove', e => {
    mk(); window.__curPos = {x:e.clientX, y:e.clientY};
    document.getElementById('__cur').style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 2}px)`;
  }, true);
  document.addEventListener('mousedown', e => {
    mk(); const r = document.getElementById('__ring');
    r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
    r.animate([{opacity:.9, transform:'scale(.4)'}, {opacity:0, transform:'scale(1.4)'}], {duration:520, easing:'ease-out'});
  }, true);
  if (document.readyState !== 'loading') mk(); else document.addEventListener('DOMContentLoaded', mk);
})();
"""


class Recorder:
    def __init__(self, page, cdp):
        self.page, self.cdp = page, cdp
        self.frames = []
        cdp.on("Page.screencastFrame", self._on)

    def _on(self, p):
        self.frames.append((p["metadata"]["timestamp"], p["data"]))
        asyncio.ensure_future(self.cdp.send("Page.screencastFrameAck", {"sessionId": p["sessionId"]}))

    async def start(self):
        self.frames = []
        self.marks = {}
        self.t0 = time.time()
        await self.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 90,
                                                     "maxWidth": VW * DSF, "maxHeight": VH * DSF, "everyNthFrame": 1})

    def mark(self, k):
        self.marks[k] = time.time()

    async def stop(self, name):
        await asyncio.sleep(0.3)
        await self.cdp.send("Page.stopScreencast")
        t1 = time.time()
        d = os.path.join(OUT, name)
        os.makedirs(d, exist_ok=True)
        for f in os.listdir(d):
            os.remove(os.path.join(d, f))
        lines = ["ffconcat version 1.0"]
        fr = self.frames
        for i, (ts, data) in enumerate(fr):
            fn = f"{i:05d}.jpg"
            with open(os.path.join(d, fn), "wb") as fh:
                fh.write(base64.b64decode(data))
            nxt = fr[i + 1][0] if i + 1 < len(fr) else t1
            lines += [f"file {fn}", f"duration {max(nxt - ts, 0.001):.4f}"]
        lines.append(f"file {len(fr) - 1:05d}.jpg")
        with open(os.path.join(d, "frames.txt"), "w") as fh:
            fh.write("\n".join(lines) + "\n")
        with open(os.path.join(d, "marks.json"), "w") as fh:
            json.dump({k: round(v - fr[0][0], 3) for k, v in self.marks.items()}, fh, indent=1)
        print(f"[{name}] {len(fr)} frames, {t1 - fr[0][0]:.1f}s", flush=True)


async def ease_move(page, x, y, ms=700):
    p = await page.evaluate("window.__curPos || {x: 640, y: 400}")
    x0, y0 = p["x"], p["y"]
    n = max(int(ms / 16), 2)
    for i in range(1, n + 1):
        t = i / n
        e = t * t * (3 - 2 * t)
        await page.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e)
        await asyncio.sleep(0.016)


async def click(page, loc, ms=700, pause=0.25):
    await loc.scroll_into_view_if_needed()
    b = await loc.bounding_box()
    await ease_move(page, b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, ms)
    await asyncio.sleep(pause)
    await page.mouse.down(); await asyncio.sleep(0.06); await page.mouse.up()


async def scroll_to(page, y, ms=1600):
    await page.evaluate("""([y, ms]) => new Promise(res => {
      const y0 = window.scrollY, t0 = performance.now();
      const step = now => { const t = Math.min((now - t0) / ms, 1);
        const e = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
        window.scrollTo(0, y0 + (y - y0) * e); t < 1 ? requestAnimationFrame(step) : res(); };
      requestAnimationFrame(step); })""", [y, ms])


async def scroll_el(page, selector_js, offset=80, ms=1600):
    if REC: REC.mark("scroll_" + selector_js[-40:].split("(")[-1].strip("\"')) "))
    y = await page.evaluate(f"(() => {{ const el = {selector_js}; return el.getBoundingClientRect().top + window.scrollY; }})()")
    await scroll_to(page, max(y - offset, 0), ms)


REC = None
def heading(txt):
    return f"[...document.querySelectorAll('h2,h3')].find(h => h.textContent.trim().startsWith({json.dumps(txt)}))"


async def run_sample(page, rec, name, label, extra):
    await page.goto(BASE + "/app", wait_until="networkidle")
    await page.mouse.move(900, 500)
    await asyncio.sleep(0.6)
    await rec.start()
    await asyncio.sleep(1.2)
    rec.mark("sample_click_start")
    await click(page, page.get_by_role("button", name=label, exact=True))
    rec.mark("sample_loaded")
    await asyncio.sleep(2.2)
    rec.mark("verify_move")
    await click(page, page.get_by_role("button", name="Verify request"))
    rec.mark("verify_click")
    await asyncio.sleep(0.3)
    await scroll_to(page, 0, 500)
    t = time.time()
    await page.get_by_text("Recommended action").wait_for(timeout=90000)
    rec.mark("result")
    print(f"[{name}] live result after {time.time() - t:.1f}s", flush=True)
    mode = await page.evaluate("document.body.innerText.includes('Offline replay')")
    print(f"[{name}] offline replay shown: {mode}", flush=True)
    await asyncio.sleep(0.4)
    await scroll_el(page, "document.querySelector('section[aria-live]')", 76, 900)
    rec.mark("result_framed")
    await ease_move(page, 1480, 380, 600)
    await asyncio.sleep(4)
    await extra(page)
    await rec.stop(name)


async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch()
        ctx = await br.new_context(viewport={"width": VW, "height": VH}, device_scale_factor=DSF,
                                   reduced_motion="no-preference")
        await ctx.add_init_script(CURSOR_JS)
        page = await ctx.new_page()
        cdp = await ctx.new_cdp_session(page)
        rec = Recorder(page, cdp)
        global REC; REC = rec

        if "landing" in WANT:
            await page.goto(BASE + "/", wait_until="networkidle")
            await page.mouse.move(1000, 600)
            await rec.start()
            await page.reload(wait_until="networkidle")
            await page.mouse.move(1000, 600)
            rec.mark("loaded")
            await asyncio.sleep(6)
            rec.mark("scroll1")
            await scroll_to(page, VH * 1.0, 2200); await asyncio.sleep(4.5)
            rec.mark("scroll2")
            await scroll_to(page, VH * 2.0, 2200); await asyncio.sleep(4.5)
            rec.mark("scroll_top")
            await scroll_to(page, 0, 2000); await asyncio.sleep(1.2)
            rec.mark("cta_move")
            cta = page.get_by_role("link", name="Open the demo").first
            await click(page, cta, 900, 0.4)
            rec.mark("cta_click")
            await page.wait_for_url("**/app")
            await asyncio.sleep(2.5)
            await rec.stop("landing")

        if "hold" in WANT:
            async def hold_extra(p):
                await scroll_el(p, heading("Evidence"), 120, 1800); await asyncio.sleep(4.5)
                await scroll_el(p, heading("Findings"), 80, 1600); await asyncio.sleep(4)
                await scroll_el(p, heading("Payment gate"), 80, 1600); await asyncio.sleep(4.5)
            await run_sample(page, rec, "hold", "Changed bank details", hold_extra)

        if "legit" in WANT:
            async def legit_extra(p):
                await scroll_el(p, heading("Evidence"), 120, 1600); await asyncio.sleep(3.5)
                await scroll_el(p, heading("Payment gate"), 80, 1600); await asyncio.sleep(3.5)
            await run_sample(page, rec, "legit", "Routine supplier invoice", legit_extra)

        if "unknown" in WANT:
            async def unk_extra(p):
                await scroll_el(p, heading("Evidence"), 120, 1600); await asyncio.sleep(3.5)
                await scroll_el(p, heading("Payment gate"), 80, 1600); await asyncio.sleep(3.5)
            await run_sample(page, rec, "unknown", "Unregistered supplier", unk_extra)

        if "inject" in WANT:
            async def inj_extra(p):
                await scroll_el(p, heading("Findings"), 80, 1600); await asyncio.sleep(5)
            await run_sample(page, rec, "inject", "Embedded AI instructions", inj_extra)

        if "records" in WANT:
            await page.goto(BASE + "/suppliers", wait_until="networkidle")
            await page.mouse.move(900, 500)
            await rec.start(); await asyncio.sleep(4.5)
            await rec.stop("records")

        await br.close()

asyncio.run(main())
