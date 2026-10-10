#!/bin/bash
# scripts/convert-webp.sh
# Auto-convert semua gambar JPG/JPEG di public/images/ ke WebP.
# + update referensi di src/content/blog/*.md & src/data/products/*.json.
#
# Cara pakai:
#   bash scripts/convert-webp.sh

set -e

IMAGES_DIR="public/images"
BLOG_DIR="src/content/blog"
PRODUCTS_DIR="src/data/products"

echo "🔍 Scan gambar JPG/JPEG di $IMAGES_DIR..."
FOUND=$(find "$IMAGES_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) 2>/dev/null | wc -l)

if [ "$FOUND" -eq 0 ]; then
  echo "✅ Nggak ada gambar JPG/JPEG baru. Semua udah WebP."
  exit 0
fi

echo "📦 Ditemukan $FOUND gambar. Mulai konversi..."
echo ""

# Step 1: Convert semua JPG/JPEG → WebP
find "$IMAGES_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | while read -r file; do
  webp_file="${file%.*}.webp"
  ffmpeg -i "$file" -quality 80 "$webp_file" -y -loglevel error
  echo "  ✅ $file → $webp_file"
done

# Step 2: Update referensi di blog .md
if [ -d "$BLOG_DIR" ]; then
  find "$BLOG_DIR" -type f -name "*.md" | while read -r md_file; do
    changed=0
    for jpg in $(find "$IMAGES_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | sed "s|^$IMAGES_DIR||"); do
      webp="${jpg%.*}.webp"
      if grep -q "$jpg" "$md_file" 2>/dev/null; then
        sed -i "s|$jpg|$webp|g" "$md_file"
        changed=1
      fi
    done
    [ "$changed" -eq 1 ] && echo "  ✅ Update referensi: $md_file"
  done
fi

# Step 3: Update referensi di product .json
if [ -d "$PRODUCTS_DIR" ]; then
  find "$PRODUCTS_DIR" -type f -name "*.json" | while read -r json_file; do
    changed=0
    for jpg in $(find "$IMAGES_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | sed "s|^$IMAGES_DIR||"); do
      webp="${jpg%.*}.webp"
      if grep -q "$jpg" "$json_file" 2>/dev/null; then
        sed -i "s|$jpg|$webp|g" "$json_file"
        changed=1
      fi
    done
    [ "$changed" -eq 1 ] && echo "  ✅ Update referensi: $json_file"
  done
fi

# Step 4: Hapus file JPG/JPEG lama
echo ""
echo "🗑️  Hapus file lama..."
find "$IMAGES_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) -delete

echo ""
echo "🎉 Selesai! Semua gambar udah WebP."
echo ""
echo "📊 Total size:"
du -sh "$IMAGES_DIR"
