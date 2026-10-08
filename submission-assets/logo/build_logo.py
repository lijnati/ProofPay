"""Builds the ProofPay logo kit (split disc) with an outlined Geist SemiBold wordmark.

Usage: python build_logo.py <path-to-Geist-SemiBold.ttf>
Writes SVGs next to this file. Geometry lives here so every variant stays identical.
"""
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

OUT = Path(__file__).parent
INK, SIGNAL, CANVAS, WHITE, CORAL = "#17181a", "#a8322a", "#f7f7f5", "#ffffff", "#e0705f"

# ---- Symbol: one disc split horizontally; the halves no longer line up. ----
R, GAP, SHIFT = 88, 12, 12  # radius, gap between halves, horizontal offset of each half
C = 128


def halves(r=R, gap=GAP, shift=SHIFT, cx=C, cy=C):
    top_y, bot_y = cy - gap / 2, cy + gap / 2
    t = f"M{cx - shift - r} {top_y}A{r} {r} 0 0 1 {cx - shift + r} {top_y}Z"
    b = f"M{cx + shift - r} {bot_y}A{r} {r} 0 0 0 {cx + shift + r} {bot_y}Z"
    return t, b


def symbol_svg(top, bottom, small=False, title="ProofPay"):
    t, b = halves(gap=24, shift=18, r=86) if small else halves()
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">'
        f"<title>{title}</title>"
        f'<path fill="{top}" d="{t}"/><path fill="{bottom}" d="{b}"/></svg>\n'
    )


def tile_svg():
    # App icon / favicon: ink tile, white top half, coral bottom half (small-size cut, scaled).
    t, b = halves(r=60, gap=18, shift=13)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">'
        "<title>ProofPay</title>"
        f'<rect width="256" height="256" rx="58" fill="{INK}"/>'
        f'<path fill="{WHITE}" d="{t}"/><path fill="{CORAL}" d="{b}"/></svg>\n'
    )


# ---- Wordmark: "ProofPay" outlined from Geist SemiBold with tight tracking. ----
def wordmark_path(font_path, cap_height_px, tracking_em=-0.025):
    font = TTFont(font_path)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    cap = font["OS/2"].sCapHeight
    scale = cap_height_px / cap
    pen = SVGPathPen(gs)
    x = 0.0
    for ch in "ProofPay":
        name = cmap[ord(ch)]
        tp = TransformPen(pen, (scale, 0, 0, -scale, x * scale, cap_height_px))
        gs[name].draw(tp)
        x += gs[name].width + tracking_em * upm
    width = (x - tracking_em * upm) * scale
    return pen.getCommands(), width


def lockup_svg(font_path, top, bottom, text_color, bg=None):
    # Symbol 256 high; cap height chosen so the wordmark sits optically level with the disc.
    cap = 118
    d, w = wordmark_path(font_path, cap)
    gap = 64
    x0 = 256 + gap
    y0 = (256 - cap) / 2 + 4  # slight optical drop
    total_w = x0 + w + 8
    t, b = halves()
    rect = f'<rect width="{total_w:.0f}" height="256" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.0f} 256" width="{total_w:.0f}" height="256">'
        f"<title>ProofPay</title>{rect}"
        f'<path fill="{top}" d="{t}"/><path fill="{bottom}" d="{b}"/>'
        f'<path fill="{text_color}" transform="translate({x0} {y0:.1f})" d="{d}"/></svg>\n'
    )


def main(font_path):
    files = {
        "proofpay-symbol.svg": symbol_svg(INK, SIGNAL),
        "proofpay-symbol-mono.svg": symbol_svg(INK, INK),
        "proofpay-symbol-white.svg": symbol_svg(WHITE, WHITE),
        "proofpay-symbol-reversed.svg": symbol_svg(WHITE, CORAL),
        "proofpay-symbol-small.svg": symbol_svg(INK, SIGNAL, small=True),
        "proofpay-app-icon.svg": tile_svg(),
        "proofpay-lockup.svg": lockup_svg(font_path, INK, SIGNAL, INK),
        "proofpay-lockup-mono.svg": lockup_svg(font_path, INK, INK, INK),
        "proofpay-lockup-reversed.svg": lockup_svg(font_path, WHITE, CORAL, WHITE, bg=INK),
    }
    for name, svg in files.items():
        (OUT / name).write_text(svg, encoding="utf-8")
        print("wrote", name)
    # Emit the geometry for the React component.
    t, b = halves()
    st, sb = halves(gap=24, shift=18, r=86)
    print("SYMBOL_TOP", t)
    print("SYMBOL_BOTTOM", b)
    print("SMALL_TOP", st)
    print("SMALL_BOTTOM", sb)


if __name__ == "__main__":
    main(sys.argv[1])
