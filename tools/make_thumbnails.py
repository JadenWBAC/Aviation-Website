"""
Makes small thumbnail copies of your gallery photos so the Gallery page loads fast.

HOW TO RUN (from your project folder, the one that contains index.html):
    python tools/make_thumbnails.py
  (on Windows you can also try:  py tools/make_thumbnails.py )

First time only, install the picture library:   pip install pillow

Your original photos are NOT changed. The thumbnails go in  images/Gallery/thumbs/
and keep the same file names as the originals.
"""
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow isn't installed yet. Run this once:   pip install pillow\nThen run this script again.")

SRC = Path("images/Gallery")
DEST = SRC / "thumbs"
WIDTH = 640      # pixels wide: sharp on phone screens, tiny file size
QUALITY = 80     # 1-100: 80 looks great and is far smaller than 95+
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

if not SRC.is_dir():
    sys.exit(f"Can't find the folder {SRC}\n"
             "Open the terminal IN your project folder (the one with index.html) and try again.")

DEST.mkdir(exist_ok=True)
count = 0
total_before = 0
total_after = 0

for photo in sorted(SRC.iterdir()):
    if not photo.is_file() or photo.suffix.lower() not in EXTENSIONS:
        continue

    out = DEST / photo.name
    with Image.open(photo) as im:
        im = ImageOps.exif_transpose(im)          # phone photos: turn upright, like they should be
        if im.width > WIDTH:
            height = round(im.height * WIDTH / im.width)
            best_quality = getattr(Image, "Resampling", Image).LANCZOS   # works on old and new Pillow
            im = im.resize((WIDTH, height), best_quality)

        if photo.suffix.lower() in (".jpg", ".jpeg"):
            im.convert("RGB").save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        elif photo.suffix.lower() == ".webp":
            im.save(out, "WEBP", quality=QUALITY)
        else:
            im.save(out, optimize=True)

    before = photo.stat().st_size
    after = out.stat().st_size
    total_before += before
    total_after += after
    count += 1
    print(f"{photo.name:32} {before / 1024 / 1024:6.2f} MB  ->  {after / 1024:6.0f} KB")

if count == 0:
    sys.exit(f"No photos found in {SRC}")

print()
print(f"Done: {count} thumbnails made.")
print(f"The Gallery grid now loads {total_after / 1024 / 1024:.1f} MB instead of {total_before / 1024 / 1024:.1f} MB.")
if total_before / count > 1.5 * 1024 * 1024:
    print("Tip: your originals are big (they still load when someone opens a photo large).")
    print("     Resizing them to about 2400 pixels wide would make that faster too.")
print()
print("Last step: put the new folder on GitHub:")
print("    git add images/Gallery/thumbs")
print("    git commit -m \"Add gallery thumbnails\"")
print("    git push")
