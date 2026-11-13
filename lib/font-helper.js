import fs from 'node:fs';
import path from 'node:path';

// Fungsi untuk menyalin SEMUA font ke /tmp agar bisa dibaca di Vercel
export function getFontsDir() {
  const fontsDir = '/tmp/fonts';
  
  // Kalau folder /tmp/fonts sudah ada, langsung pakai
  if (fs.existsSync(fontsDir)) {
    return fontsDir;
  }

  try {
    // Bikin folder /tmp/fonts
    fs.mkdirSync(fontsDir, { recursive: true });
    
    // Path asli folder font di project (process.cwd() = root project)
    const sourceDir = path.join(process.cwd(), 'lib', 'fonts');
    const files = fs.readdirSync(sourceDir);
    
    // Copy semua file .ttf ke /tmp/fonts
    for (const file of files) {
      if (file.endsWith('.ttf')) {
        fs.copyFileSync(path.join(sourceDir, file), path.join(fontsDir, file));
      }
    }
    return fontsDir;
  } catch (err) {
    console.error('[font-helper] Gagal copy fonts:', err.message);
    // Fallback ke folder asli (buat lokal)
    return path.join(process.cwd(), 'lib', 'fonts');
  }
}
