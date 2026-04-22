"""
Voicely AI — Google Play Feature Graphic Generator
===================================================
Generates the 1024x500 feature graphic required for Play Store listing.

Layout:
  [ ICON (240px, rounded) ]    Voicely AI
                               Sesli Hatirlatici + Mini CRM
                               Konus - AI anlasin - Hatirlatsin

Background: diagonal indigo -> purple gradient (same palette as app icon).

Usage:
  python scripts/build-feature-graphic.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH, HEIGHT = 1024, 500
OUTPUT = Path("assets/brand/feature-graphic.png")
ICON_SRC = Path("assets/icon.png")

# Brand palette (matches icon gradient extremes)
GRADIENT_START = (79, 70, 229)     # #4F46E5 indigo
GRADIENT_END = (124, 58, 237)      # #7C3AED purple
WHITE = (255, 255, 255, 255)
SUBTITLE_COLOR = (235, 235, 255, 235)
TAGLINE_COLOR = (210, 210, 245, 190)


def build_gradient(w: int, h: int) -> Image.Image:
    """Fast vertical gradient via 1-column render + horizontal resize."""
    column = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / (h - 1)
        px = tuple(
            int(GRADIENT_START[i] + (GRADIENT_END[i] - GRADIENT_START[i]) * t)
            for i in range(3)
        )
        column.putpixel((0, y), px)
    return column.resize((w, h), Image.Resampling.BILINEAR)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Try Segoe UI Bold/Semibold/Regular, fall back to Arial, then default."""
    if bold:
        candidates = [
            "C:/Windows/Fonts/seguisb.ttf",   # Segoe UI Semibold
            "C:/Windows/Fonts/segoeuib.ttf",  # Segoe UI Bold
            "C:/Windows/Fonts/arialbd.ttf",   # Arial Bold
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/segoeui.ttf",   # Segoe UI Regular
            "C:/Windows/Fonts/arial.ttf",     # Arial
        ]

    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)

    print(f"  [warn] No font found, using Pillow default for size {size}")
    return ImageFont.load_default()


def draw_icon_with_shadow(canvas: Image.Image, icon_path: Path, size: int, pos: tuple[int, int]) -> None:
    """Paste the app icon with a rounded-rectangle mask and soft drop shadow."""
    icon = Image.open(icon_path).convert("RGBA")
    icon = icon.resize((size, size), Image.Resampling.LANCZOS)

    # Rounded corner mask (~22% of size, matching iOS/Material Design standards)
    radius = int(size * 0.22)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=radius, fill=255)

    # Shadow layer — draw a blurred black rounded-rect offset down-right
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_offset = (pos[0] + 6, pos[1] + 10)
    shadow_draw.rounded_rectangle(
        (shadow_offset[0], shadow_offset[1],
         shadow_offset[0] + size, shadow_offset[1] + size),
        radius=radius,
        fill=(0, 0, 0, 110),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(shadow)

    # Paste the masked icon on top
    canvas.paste(icon, pos, mask)


def main() -> None:
    print(f"[1/4] Building gradient background {WIDTH}x{HEIGHT}...")
    canvas = build_gradient(WIDTH, HEIGHT).convert("RGBA")

    icon_size = 260
    icon_x = 80
    icon_y = (HEIGHT - icon_size) // 2
    print(f"[2/4] Compositing icon ({icon_size}x{icon_size}) at ({icon_x}, {icon_y})...")
    draw_icon_with_shadow(canvas, ICON_SRC, icon_size, (icon_x, icon_y))

    print("[3/4] Rendering text (title + subtitle + tagline)...")
    draw = ImageDraw.Draw(canvas)
    title_font = load_font(96, bold=True)
    subtitle_font = load_font(38, bold=False)
    tagline_font = load_font(26, bold=False)

    text_x = icon_x + icon_size + 50
    draw.text((text_x, 145), "Voicely AI", font=title_font, fill=WHITE)
    draw.text((text_x, 265), "Sesli Hatırlatıcı + Mini CRM", font=subtitle_font, fill=SUBTITLE_COLOR)
    draw.text((text_x, 325), "Konuş · AI anlasın · Hatırlatsın", font=tagline_font, fill=TAGLINE_COLOR)

    print(f"[4/4] Exporting PNG to {OUTPUT}...")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUTPUT, "PNG", optimize=True)

    check = Image.open(OUTPUT)
    assert check.size == (WIDTH, HEIGHT), f"Size mismatch: {check.size}"
    assert check.mode == "RGB", f"Mode mismatch: {check.mode}"
    print(f"\nDONE: {check.size[0]}x{check.size[1]} RGB  ({OUTPUT.stat().st_size // 1024} KB)")
    print(f"      Play Store-ready. Upload path in Console: Store listing > Graphics > Feature graphic")


if __name__ == "__main__":
    main()
