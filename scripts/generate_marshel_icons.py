"""Generate browser/PWA sizes from the assembled emblem rendered by Blender."""

from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / "front_end"
brand = root / "public" / "brand"
logo = Image.open(brand / "marshel-logo-v1.png").convert("RGBA")
for name, size, opaque in (
    ("marshel-favicon-v1.png", 32, False),
    ("marshel-apple-v1.png", 180, True),
    ("marshel-icon-192-v1.png", 192, True),
    ("marshel-icon-512-v1.png", 512, True),
):
    icon = logo.resize((size, size), Image.Resampling.LANCZOS)
    if opaque:
        background = Image.new("RGBA", (size, size), "#17201e")
        # Keep the maskable emblem inside the central safe circle.
        inner = icon.resize((round(size * 0.85), round(size * 0.85)), Image.Resampling.LANCZOS)
        background.alpha_composite(inner, ((size - inner.width) // 2, (size - inner.height) // 2))
        icon = background.convert("RGB")
    icon.save(brand / name, optimize=True)
logo.save(root / "src" / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("Generated favicon, Apple icon, and 192/512 PWA icons")
