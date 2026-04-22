"""
Voicely AI — App Icon Processor
================================
Transforms AI-generated icon draft into App Store-ready 1024x1024 PNG.

Pipeline:
  1. Load source (any size, RGBA allowed)
  2. Center-crop to square
  3. Lanczos resize to 1024x1024
  4. Composite over solid indigo fallback (strips alpha safely)
  5. Save as RGB PNG (no alpha) in sRGB color space

Usage:
  python scripts/process-icon.py
"""
from pathlib import Path
from PIL import Image

SOURCE = Path("assets/brand/icon-source-wide.png")
TARGET = Path("assets/icon.png")
TARGET_BRAND = Path("assets/brand/icon-1024.png")  # also keep a brand-folder copy

# Fallback color if alpha needs to be flattened — matches indigo gradient midpoint.
# (#5B4FE0) → average of #4F46E5 and #7C3AED gradient extremes
FALLBACK_BG = (91, 79, 224)

FINAL_SIZE = 1024


def process():
    src = Image.open(SOURCE)
    print(f"[1/5] Loaded: {src.size[0]}x{src.size[1]} mode={src.mode}")

    # Ensure RGBA so alpha-aware operations work even on RGB sources
    if src.mode != "RGBA":
        src = src.convert("RGBA")

    # Center-crop to square
    w, h = src.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    square = src.crop((left, top, left + side, top + side))
    print(f"[2/5] Center-cropped to: {square.size[0]}x{square.size[1]}")

    # Resize to final size with Lanczos (best for sharp vector-style art)
    resized = square.resize((FINAL_SIZE, FINAL_SIZE), Image.Resampling.LANCZOS)
    print(f"[3/5] Resized to: {resized.size[0]}x{resized.size[1]}")

    # Composite over solid indigo to safely strip alpha
    background = Image.new("RGB", (FINAL_SIZE, FINAL_SIZE), FALLBACK_BG)
    background.paste(resized, mask=resized.split()[3])  # paste using alpha as mask
    print(f"[4/5] Alpha stripped, background composited")

    # Save both target paths — no alpha, optimized
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET_BRAND.parent.mkdir(parents=True, exist_ok=True)
    background.save(TARGET, "PNG", optimize=True)
    background.save(TARGET_BRAND, "PNG", optimize=True)
    print(f"[5/5] Saved:")
    print(f"      - {TARGET} ({TARGET.stat().st_size // 1024} KB)")
    print(f"      - {TARGET_BRAND} ({TARGET_BRAND.stat().st_size // 1024} KB)")

    # Final verification — reopen and check properties
    check = Image.open(TARGET)
    assert check.size == (FINAL_SIZE, FINAL_SIZE), f"Size mismatch: {check.size}"
    assert check.mode == "RGB", f"Mode should be RGB (no alpha), got {check.mode}"
    print(f"\nVERIFICATION: {check.size[0]}x{check.size[1]} mode={check.mode} — App Store ready.")


if __name__ == "__main__":
    process()
