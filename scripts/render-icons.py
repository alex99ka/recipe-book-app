"""Render every app icon from resources/logo.svg.

    python scripts/render-icons.py    (from the repo root, on Windows with Edge)

Outputs: resources/icon.png and resources/splash.png (the Android launcher icon
and splash, made from these by @capacitor/assets in CI), and the web build's
logo, maskable icon and favicon. Needs Pillow and Microsoft Edge.
"""
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SVG = ROOT / "resources" / "logo.svg"
EDGE = next(p for p in (
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
) if p.exists())
SPLASH_BG = "linear-gradient(135deg, #E0703A, #A63D1B)"  # the logo's background


def shoot(html: str, size: int, out: Path):
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "page.html"
        page.write_text(html, encoding="utf-8")
        subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", "--hide-scrollbars",
                        "--default-background-color=00000000", f"--window-size={size},{size}",
                        f"--screenshot={out}", page.as_uri()], check=True, capture_output=True)
    im = Image.open(out)
    assert im.size == (size, size), f"{out.name} came out {im.size}"


def main():
    svg = SVG.read_text(encoding="utf-8")
    page = "<html><body style='margin:0;{bg}'>{svg}</body></html>"
    work = Path(tempfile.mkdtemp())
    try:
        master = work / "master.png"
        shoot(page.format(bg="", svg=svg), 1024, master)
        # Splash: the glyph alone, at about 40% width, on the background colour.
        glyph = svg.replace('<rect id="background"', '<rect id="background" display="none"').replace(
            'width="1024" height="1024"', 'width="1100" height="1100"', 1)
        splash = work / "splash.png"
        shoot("<html><body style='margin:0;height:100vh;display:grid;place-items:center;"
              f"background:{SPLASH_BG}'>{glyph}</body></html>", 2732, splash)

        icon = Image.open(master).convert("RGBA")
        icon.save(ROOT / "resources" / "icon.png")
        Image.open(splash).convert("RGB").save(ROOT / "resources" / "splash.png")
        imgs = ROOT / "src" / "assets" / "imgs"
        icon.resize((512, 512), Image.LANCZOS).save(imgs / "icon-maskable.png")
        # The sign-in page and the web manifest's "any" icon: rounded corners.
        mask = Image.new("L", (1024, 1024), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, 1023, 1023), radius=224, fill=255)
        rounded = icon.copy()
        rounded.putalpha(mask)
        rounded.resize((512, 512), Image.LANCZOS).save(imgs / "logo.png")
        rounded.save(ROOT / "src" / "assets" / "icon" / "fav.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    finally:
        shutil.rmtree(work, ignore_errors=True)
    print("icons rendered")


if __name__ == "__main__":
    main()
