from PIL import Image
from pathlib import Path

SRC = Path(__file__).parent.parent / "iphone-screenshots"
DST = Path(__file__).parent.parent / "ipad-screenshots"
DST.mkdir(exist_ok=True)

IPAD_W, IPAD_H = 2064, 2752
BG = (15, 23, 42)  # #0F172A dark navy

files = sorted([f for f in SRC.iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png")])

for i, src_file in enumerate(files, 1):
    iphone = Image.open(src_file).convert("RGB")
    canvas = Image.new("RGB", (IPAD_W, IPAD_H), BG)

    scale = min(IPAD_W / iphone.width, IPAD_H / iphone.height)
    new_w = int(iphone.width * scale)
    new_h = int(iphone.height * scale)
    iphone_resized = iphone.resize((new_w, new_h), Image.LANCZOS)

    x = (IPAD_W - new_w) // 2
    y = (IPAD_H - new_h) // 2
    canvas.paste(iphone_resized, (x, y))

    out = DST / f"ipad_{i:02d}.png"
    canvas.save(out, "PNG", optimize=True)
    print(f"[{i}/{len(files)}] {src_file.name} ({iphone.width}x{iphone.height}) -> {out.name} ({IPAD_W}x{IPAD_H})")

print(f"\nDone. {len(files)} files written to {DST}")
