"""Generates the Google Play graphics: icon, feature graphic and screenshots.

Requirements: Python 3 with Pillow and Playwright (`pip install pillow playwright`)
and Google Chrome installed. Run from anywhere: `python store/make_graphics.py`.
"""

import functools
import http.server
import math
import threading
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / 'web'
OUT = ROOT / 'store' / 'graphics'

CYAN = (51, 204, 204)
LIGHT_CYAN = (170, 255, 255)
SS = 4  # supersampling factor for smooth edges

FONTS = Path('C:/Windows/Fonts')


def font(names, size):
    for name in names:
        for path in (FONTS / name, Path('/usr/share/fonts/truetype/dejavu') / name):
            if path.exists():
                return ImageFont.truetype(str(path), size)
    return ImageFont.load_default(size)


def draw_pyramid(draw, cx, cy, half, stroke):
    """Pyramid seen from above, same shape as the launcher icon (outer 48, inner 16, dot 5 of 108)."""
    inner = half / 3
    dot = half * 5 / 24
    outer_box = [cx - half, cy - half, cx + half, cy + half]
    inner_box = [cx - inner, cy - inner, cx + inner, cy + inner]
    draw.rectangle(outer_box, fill=CYAN + (26,))
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        draw.line([(cx + sx * half, cy + sy * half), (cx + sx * inner, cy + sy * inner)],
                  fill=CYAN, width=stroke)
    draw.rectangle(outer_box, outline=CYAN, width=stroke)
    draw.rectangle(inner_box, outline=CYAN, width=stroke)
    draw.polygon([(cx, cy - dot), (cx + dot, cy), (cx, cy + dot), (cx - dot, cy)], fill=LIGHT_CYAN)


def glow(image, radius, strength=1.0):
    blurred = image.filter(ImageFilter.GaussianBlur(radius))
    if strength != 1.0:
        blurred = Image.eval(blurred, lambda v: min(255, int(v * strength)))
    return Image.alpha_composite(Image.new('RGBA', image.size, (0, 0, 0, 255)),
                                 Image.alpha_composite(blurred, image))


def make_icon():
    size = 512 * SS
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw_pyramid(ImageDraw.Draw(layer), size / 2, size / 2, size * 0.34, int(size * 0.034))
    icon = glow(layer, size * 0.02, 1.6).resize((512, 512), Image.LANCZOS).convert('RGB')
    icon.save(OUT / 'icon-512.png')


def make_feature_graphic():
    w, h = 1024 * SS, 500 * SS
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw_pyramid(draw, 250 * SS, h / 2, 150 * SS, 9 * SS)

    x = 460 * SS
    title_size = 76
    while True:
        title = font(['segoeuib.ttf', 'DejaVuSans-Bold.ttf'], title_size * SS)
        if draw.textlength('Holographicator', font=title) <= w - x - 40 * SS:
            break
        title_size -= 2
    tagline = font(['segoeui.ttf', 'DejaVuSans.ttf'], 34 * SS)
    draw.text((x, 175 * SS), 'Holographicator', font=title, fill=(127, 255, 255), anchor='ls')
    lines = ['Convertí tu celular en un', 'proyector holográfico']
    for i, line in enumerate(lines):
        draw.text((x, (250 + i * 46) * SS), line, font=tagline, fill=(232, 232, 236), anchor='ls')
    small = font(['segoeui.ttf', 'DejaVuSans.ttf'], 24 * SS)
    draw.text((x, 380 * SS), 'YouTube · videos · fotos · cámara', font=small, fill=(150, 150, 160), anchor='ls')

    graphic = glow(layer, 6 * SS, 1.4).resize((1024, 500), Image.LANCZOS).convert('RGB')
    graphic.save(OUT / 'feature-graphic-1024x500.png')


def make_sample_image(path):
    """A neon 'atom' on black, the kind of picture that looks best in the pyramid."""
    w, h = 1280 * SS // 2, 720 * SS // 2
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    cx, cy = w / 2, h / 2
    rx, ry = w * 0.30, h * 0.15
    colors = [(0, 255, 255), (255, 80, 220), (120, 160, 255)]
    for k, color in enumerate(colors):
        angle = math.radians(k * 60)
        points = []
        for t in range(0, 361, 2):
            a = math.radians(t)
            x, y = rx * math.cos(a), ry * math.sin(a)
            points.append((cx + x * math.cos(angle) - y * math.sin(angle),
                           cy + x * math.sin(angle) + y * math.cos(angle)))
        ImageDraw.Draw(layer).line(points, fill=color + (255,), width=10, joint='curve')
        ex, ey = points[(k * 50) % len(points)]
        ImageDraw.Draw(layer).ellipse([ex - 18, ey - 18, ex + 18, ey + 18], fill=(255, 255, 255, 255))
    r = h * 0.07
    ImageDraw.Draw(layer).ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 240, 160, 255))
    glow(glow(layer, 30, 1.8), 8).convert('RGB').save(path)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(directory):
    handler = functools.partial(QuietHandler, directory=str(directory))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def make_screenshots(sample):
    from playwright.sync_api import sync_playwright

    server = serve(WEB)
    url = f'http://127.0.0.1:{server.server_port}/index.html'
    settings = '{"mode":"file","helpSeen":true}'
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='chrome')
            # 360x640 CSS px at 3x = 1080x1920, a 9:16 phone screenshot.
            page = browser.new_page(viewport={'width': 360, 'height': 640}, device_scale_factor=3)
            page.add_init_script(f"localStorage.setItem('holographicator.settings', '{settings}')")
            # Pretend to be the Android app so the page shows the in-app UI.
            page.add_init_script("window.HoloApp = { version: () => '', pxPerCm: () => 55 }")
            page.goto(url)
            page.set_input_files('#file-input', str(sample))
            page.wait_for_timeout(800)

            page.screenshot(path=str(OUT / 'screenshot-1-menu.png'))
            page.click('#close-panel')
            page.wait_for_timeout(300)
            page.screenshot(path=str(OUT / 'screenshot-2-holograma.png'))
            page.click('#tap-layer', position={'x': 20, 'y': 20})
            page.click('#open-help')
            page.wait_for_timeout(300)
            page.screenshot(path=str(OUT / 'screenshot-3-como-armar.png'))
            page.evaluate("document.querySelector('.diagram').previousElementSibling.scrollIntoView()")
            page.wait_for_timeout(200)
            page.screenshot(path=str(OUT / 'screenshot-4-mirar.png'))
            browser.close()
    finally:
        server.shutdown()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    make_icon()
    make_feature_graphic()
    sample = OUT / 'atomo.png'
    make_sample_image(sample)
    make_screenshots(sample)
    sample.unlink()
    for path in sorted(OUT.iterdir()):
        with Image.open(path) as image:
            print(f'{path.name}: {image.size[0]}x{image.size[1]}')


if __name__ == '__main__':
    main()
