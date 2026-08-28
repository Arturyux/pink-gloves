import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

/* Gallery photos live in public/img/gallery/<category>/ alongside every other
   image. Vite copies public/ through verbatim without putting it in the module
   graph, so import.meta.glob cannot see into it — this plugin scans the folder
   itself and hands main.js the list as `virtual:gallery`.

   Paths are emitted without a leading slash and prefixed with BASE_URL at
   runtime, so they keep working under `base: './'` in a subfolder. */
const GALLERY_DIR = 'public/img/gallery'
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i

function readGallery(root) {
  const dir = path.join(root, GALLERY_DIR)
  const byCategory = {}
  if (!fs.existsSync(dir)) return byCategory

  for (const category of fs.readdirSync(dir).sort()) {
    const categoryDir = path.join(dir, category)
    if (!fs.statSync(categoryDir).isDirectory()) continue
    const files = fs.readdirSync(categoryDir).filter(f => IMAGE_EXT.test(f)).sort()
    if (files.length) byCategory[category] = files.map(f => `img/gallery/${category}/${f}`)
  }
  return byCategory
}

function galleryManifest() {
  const id = 'virtual:gallery'
  const resolvedId = '\0' + id
  let root = process.cwd()

  return {
    name: 'gallery-manifest',
    configResolved(config) { root = config.root },
    resolveId(source) { return source === id ? resolvedId : null },
    load(loadedId) {
      if (loadedId !== resolvedId) return null
      return `export default ${JSON.stringify(readGallery(root))}`
    },
  }
}

export default defineConfig({
  // relative paths, so dist/ works in any folder on one.com
  base: './',
  plugins: [galleryManifest()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    open: true,
  },
})
