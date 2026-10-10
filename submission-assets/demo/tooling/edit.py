"""Assemble the ProofPay demo from real takes + brand cards.

python edit.py [--only N]   -> out/proofpay-demo.mp4, out/proofpay-demo.srt
Coordinates for zoom are in CSS px of the 1600x900 viewport (frames are 2x).
"""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FF = open(os.path.join(HERE, "ffpath.txt")).read().strip()
TAKES = os.path.join(HERE, "takes")
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
CLIPS = os.path.join(OUT, "clips"); os.makedirs(CLIPS, exist_ok=True)
PNG = os.path.join(OUT, "png"); os.makedirs(PNG, exist_ok=True)
FPS = 30
LOGO = "file:///" + os.path.abspath(r"F:\Hackthon Projects\ProofPay\submission-assets\logo\proofpay-lockup-reversed.svg").replace("\\", "/")


def M(take, key):
    return json.load(open(os.path.join(TAKES, take, "marks.json")))[key]


def END(take):
    lines = open(os.path.join(TAKES, take, "frames.txt")).read().split("\n")
    return sum(float(l.split()[1]) for l in lines if l.startswith("duration"))


# ---------------------------------------------------------------- timeline
# card:  ("card", id, dur, captions)
# take:  ("take", take, t0, t1, speed, zoom, captions, badge)
#        zoom = (z0, cx0, cy0, z1, cx1, cy1, ramp_seconds)
# captions: [(start, end, html)] in OUTPUT seconds relative to the clip; end=None -> clip end
Z1 = (1, 800, 450, 1, 800, 450, 0)


def zin(z, cx, cy, ramp=1.0, frm=(1, 800, 450)):
    return (frm[0], frm[1], frm[2], z, cx, cy, ramp)


def hold(z, cx, cy):
    return (z, cx, cy, z, cx, cy, 0)


def timeline():
    h, l, u, j, g, r = "hold", "legit", "unknown", "inject", "landing", "records"
    T = []
    # Scene 1 — the problem (0:00–0:20)
    T += [("card", "statement", 7.0, [])]
    T += [("card", "email", 13.0, [
        (0.6, 6.6, "This request claims to come from Northwind Packaging, a supplier the business already pays."),
        (6.8, None, "Everything looks routine, except where the money goes."),
    ])]
    # Scene 2 — landing (0:20–0:40)
    T += [("take", g, M(g, "loaded") + 0.2, M(g, "scroll1") + 0.2, 1, Z1, [
        (0.3, None, "ProofPay checks a payment request before anyone pays it."),
    ], None)]
    T += [("take", g, M(g, "scroll1") + 0.2, M(g, "scroll2") + 0.5, 1, Z1, [
        (0.0, None, "AI reads the request. Independent code compares it with the supplier records you already trust."),
    ], None)]
    T += [("take", g, M(g, "cta_move") - 0.2, END(g), 1, Z1, [
        (0.0, None, "If they don't match, it shows the evidence and holds the payment. Here's the real app."),
    ], None)]
    # Scene 3 — the detection (0:40–1:35)
    T += [("take", r, 0.3, END(r), 1, Z1, [
        (0.2, None, "Trusted records: synthetic suppliers with payment details confirmed earlier by call-back. The AI never writes these."),
    ], None)]
    T += [("take", h, M(h, "sample_click_start") - 0.6, M(h, "verify_click") + 1.2, 1, hold(1.4, 560, 400), [
        (0.3, None, "A synthetic request claiming to be Northwind: new bank details, a deadline, and a reason not to call."),
    ], None)]
    T += [("take", h, M(h, "verify_click") + 1.2, M(h, "result") - 0.2, 2.5, Z1, [
        (0.2, None, "Live AI extraction: the model quotes the payee, account, amount and sender word for word, and code checks every quote against the text."),
    ], "LIVE AI CALL · gpt-5-mini · wait shown at 2.5×")]
    T += [("take", h, M(h, "result") - 0.2, M(h, "result") + 3.2, 1, hold(1.3, 1010, 300), [
        (0.4, None, "Payment held."),
    ], None)]
    T += [("take", h, M(h, "result") + 3.2, M(h, "scroll_Evidence") - 0.1, 1, zin(1.55, 1020, 400, 1.0, (1.3, 1010, 300)), [
        (0.6, None, 'Request: <span class="m">GB33 HRBR 6016 1331 9268 19</span>. Trusted record: <span class="ok">GB82 WEST 1234 5698 7654 32</span>.<br>Different account.'),
    ], None, 3.0)]
    T += [("take", h, M(h, "scroll_Evidence"), M(h, "scroll_Findings") - 0.1, 1, hold(1.3, 1015, 480), [
        (1.6, None, "Field by field: the supplier name matches, but the sender domain, account holder, bank and account do not."),
    ], None)]
    T += [("take", h, M(h, "scroll_Findings"), M(h, "scroll_Payment gate") - 0.1, 1, hold(1.3, 1015, 470), [
        (1.4, None, "Each finding quotes the request and names the trusted record it was compared with."),
    ], None)]
    T += [("take", h, M(h, "scroll_Payment gate"), END(h) - 0.2, 1, hold(1.45, 1010, 400), [
        (1.4, None, "The simulated payment gate is locked: call the supplier on a number you already have."),
    ], None)]
    # Scene 4 — more than a scam detector (1:35–2:10)
    T += [("take", l, M(l, "sample_click_start") - 0.4, M(l, "verify_click") + 1.0, 1, Z1, [
        (0.2, None, "Now the routine invoice from the same supplier."),
    ], None)]
    T += [("take", l, M(l, "verify_click") + 1.0, M(l, "result") - 0.2, 3, Z1, [], "LIVE AI CALL · gpt-5-mini · wait shown at 3×")]
    T += [("take", l, M(l, "result") - 0.2, M(l, "result") + 5.0, 1, hold(1.4, 1010, 330), [
        (0.4, None, "No mismatch against registered records. That's not a guarantee. It means normal approval can continue."),
    ], None)]
    T += [("take", u, M(u, "sample_click_start") - 0.4, M(u, "verify_click") + 1.0, 1, Z1, [
        (0.2, None, "An invoice from a supplier with no trusted record."),
    ], None)]
    T += [("take", u, M(u, "verify_click") + 1.0, M(u, "result") - 0.2, 3, Z1, [], "LIVE AI CALL · gpt-5-mini · wait shown at 3×")]
    T += [("take", u, M(u, "result") - 0.2, M(u, "result") + 6.0, 1, hold(1.4, 1010, 330), [
        (0.4, None, "Nothing to compare against, so a person must review it. ProofPay separates missing evidence from an observed mismatch."),
    ], None)]
    # Scene 5 — technical (2:10–2:40)
    T += [("card", "arch", 12.0, [])]
    T += [("take", j, M(j, "scroll_Findings"), END(j) - 0.2, 1, hold(1.35, 1010, 430), [
        (0.8, None, "An invoice hiding instructions to “approve without flagging”: detected and listed as a finding. The payment is still held."),
    ], "LIVE AI CALL · gpt-5-mini · real time")]
    T += [("card", "proof", 9.0, [])]
    # Scene 6 — closing (2:40–3:00)
    T += [("take", h, M(h, "result") + 0.5, M(h, "result") + 5.9, 1, hold(1.55, 1020, 400), [
        (0.2, 2.9, "Payment fraud doesn't always look suspicious. Sometimes it's one changed account number."),
        (3.0, None, "ProofPay makes that change visible before money moves."),
    ], None)]
    T += [("card", "end", 7.0, [])]
    return T


# ---------------------------------------------------------------- rendering
async def render_pngs(T):
    jobs = {}
    for i, seg in enumerate(T):
        if seg[0] == "card":
            jobs[f"card_{seg[1]}"] = ("show", seg[1])
        caps = seg[3] if seg[0] == "card" else seg[6]
        for k, c in enumerate(caps):
            jobs[f"cap_{i:02d}_{k}"] = ("caption", c[2])
        if seg[0] == "take" and seg[7]:
            jobs[f"badge_{i:02d}"] = ("badge", seg[7])
    html = open(os.path.join(HERE, "cards.html"), encoding="utf-8").read().replace("LOGO_REV", LOGO)
    tmp = os.path.join(OUT, "cards_render.html"); open(tmp, "w", encoding="utf-8").write(html)
    async with async_playwright() as pw:
        br = await pw.chromium.launch()
        pg = await br.new_page(viewport={"width": 1920, "height": 1080})
        await pg.goto("file:///" + tmp.replace("\\", "/"), wait_until="networkidle")
        await pg.evaluate("document.fonts.ready")
        for name, (fn, arg) in jobs.items():
            await pg.evaluate(f"window.{fn}({json.dumps(arg)})")
            await pg.screenshot(path=os.path.join(PNG, name + ".png"), omit_background=(fn != "show"))
        await br.close()


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-3000:]); sys.exit(1)


def zoompan(z, dur):
    z0, x0, y0, z1, x1, y1, ramp = z
    if z0 == z1 and x0 == x1 and y0 == y1:
        if z0 == 1:
            return "scale=1920:1080:flags=lanczos"
        w, hh = 1600 / z0, 900 / z0
        X = min(max(x0 - w / 2, 0), 1600 - w); Y = min(max(y0 - hh / 2, 0), 900 - hh)
        return f"crop={int(w*2)}:{int(hh*2)}:{int(X*2)}:{int(Y*2)},scale=1920:1080:flags=lanczos"
    n = max(int(ramp * FPS), 1)
    p = f"min(on/{n},1)"; e = f"({p}*{p}*(3-2*{p}))"
    Z = f"({z0}+({z1}-{z0})*{e})"
    CX = f"(({x0}+({x1}-{x0})*{e})*2)"; CY = f"(({y0}+({y1}-{y0})*{e})*2)"
    X = f"max(0,min(iw-iw/zoom,{CX}-iw/zoom/2))"; Y = f"max(0,min(ih-ih/zoom,{CY}-ih/zoom/2))"
    return f"zoompan=z='{Z}':x='{X}':y='{Y}':d=1:s=1920x1080:fps={FPS}"


def build_clip(i, seg):
    out = os.path.join(CLIPS, f"{i:02d}.mp4")
    inputs, chains, caps = [], [], []
    if seg[0] == "card":
        _, cid, dur, caps = seg
        inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur}", "-i", os.path.join(PNG, f"card_{cid}.png")]
        base = f"[0]format=yuv420p,fade=in:st=0:d=0.35,fade=out:st={dur-0.35}:d=0.35[v0]"
        badge = None
    else:
        _, take, t0, t1, speed, z, caps, badge = seg[:8]
        pad = seg[8] if len(seg) > 8 else 0
        dur = (t1 - t0) / speed + pad
        inputs += ["-f", "concat", "-safe", "0", "-i", os.path.join(TAKES, take, "frames.txt")]
        base = (f"[0]fps={FPS},trim=start={t0:.3f}:end={t1:.3f},setpts=(PTS-STARTPTS)/{speed},fps={FPS},"
                f"tpad=stop_mode=clone:stop_duration={pad},scale=3200:1800:flags=lanczos,{zoompan(z, dur)},unsharp=5:5:0.5,format=yuv420p,trim=duration={dur:.3f}[v0]")
    chains.append(base)
    cur, idx = "v0", 1
    overlays = []
    for k, c in enumerate(caps):
        overlays.append((f"cap_{i:02d}_{k}", c[0], c[1] if c[1] is not None else dur))
    if badge:
        overlays.append((f"badge_{i:02d}", 0.0, dur))
    for name, a, b in overlays:
        inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur}", "-i", os.path.join(PNG, name + ".png")]
        fi = f"fade=in:st={a}:d=0.25:alpha=1," if a > 0 else ""
        fo = f"fade=out:st={b-0.25:.3f}:d=0.25:alpha=1" if b < dur - 0.05 else "null"
        chains.append(f"[{idx}]format=rgba,{fi}{fo}[o{idx}]")
        chains.append(f"[{cur}][o{idx}]overlay=0:0:enable='between(t,{a},{b})'[v{idx}]")
        cur = f"v{idx}"; idx += 1
    run([FF, "-y", "-v", "error", *inputs, "-filter_complex", ";".join(chains), "-map", f"[{cur}]",
         "-t", f"{dur:.3f}", "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "16",
         "-pix_fmt", "yuv420p", out])
    return out, dur


def srt_time(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    T = timeline()
    if "--skip-png" not in sys.argv:
        asyncio.run(render_pngs(T))
    clips, t, srt, plan = [], 0.0, [], []
    for i, seg in enumerate(T):
        path, dur = build_clip(i, seg)
        clips.append(path)
        caps = seg[3] if seg[0] == "card" else seg[6]
        for a, b, html in caps:
            import re
            txt = re.sub(r"<br>", "\n", html); txt = re.sub(r"<[^>]+>", "", txt)
            srt.append((t + a, t + (b if b is not None else dur), txt))
        plan.append(f"{srt_time(t)[:8]}  {dur:5.1f}s  {seg[0]:4s} {seg[1]}")
        t += dur
        print(plan[-1], flush=True)
    with open(os.path.join(OUT, "clips.txt"), "w") as fh:
        fh.write("\n".join(f"file '{c.replace(os.sep, '/')}'" for c in clips))
    total = t
    silent = os.path.join(OUT, "video_silent.mp4")
    run([FF, "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(OUT, "clips.txt"), "-r", str(FPS),
         "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", silent])
    # quiet, sustained pad (A-major add9), fades in/out; sits well under a later voice-over
    pad = ("aevalsrc='0.5*sin(2*PI*110*t)+0.32*sin(2*PI*164.81*t)+0.26*sin(2*PI*277.18*t)+0.18*sin(2*PI*246.94*t)"
           "+0.12*sin(2*PI*329.63*t)*(0.6+0.4*sin(2*PI*0.07*t))':s=48000:d=" + f"{total:.2f}")
    music = os.path.join(OUT, "pad.m4a")
    run([FF, "-y", "-v", "error", "-f", "lavfi", "-i", pad, "-af",
         f"lowpass=f=900,volume=0.05,afade=in:st=0:d=3,afade=out:st={total-4:.2f}:d=4,aformat=channel_layouts=stereo",
         "-c:a", "aac", "-b:a", "160k", music])
    final = os.path.join(OUT, "proofpay-demo.mp4")
    run([FF, "-y", "-v", "error", "-i", silent, "-i", music, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
         "-c:a", "copy", "-shortest", "-movflags", "+faststart", final])
    with open(os.path.join(OUT, "proofpay-demo.srt"), "w", encoding="utf-8") as fh:
        for n, (a, b, txt) in enumerate(srt, 1):
            fh.write(f"{n}\n{srt_time(a)} --> {srt_time(b)}\n{txt}\n\n")
    with open(os.path.join(OUT, "plan.txt"), "w") as fh:
        fh.write("\n".join(plan) + f"\nTOTAL {total:.1f}s\n")
    print(f"TOTAL {total:.1f}s -> {final}")


if __name__ == "__main__":
    main()
