# Alfeto image assets

Keep images in the folder for their purpose:

```text
public/images/
├── blog/
│   └── <article-slug>/
│       ├── hero.webp
│       ├── 01-wpc-wall-panel.webp
│       └── 02-wall-mirror.webp
└── products/
    ├── wpc-wood-wall-panel.jpg
    └── cermin-dinding-gantung-aesthetic.jpg
```

## Blog images

Use the article's Markdown filename (without `.md` or `.mdx`) as its folder name.
Use `hero.webp` for the article cover, then number inline images in reading order
with a short descriptive name, such as `01-wpc-wall-panel.webp`.

Reference files from Markdown with their public URL, for example:

```md
![WPC wood wall panel](/images/blog/dekorasi-dinding-aesthetic/01-wpc-wall-panel.webp)
```

## Product images

Name each product image with its `id` from `src/data/products.ts`, followed by
its real file extension (for example `.jpg`, `.png`, or `.webp`). Reference it
from product data with a root-relative public URL, such as
`/images/products/wpc-wood-wall-panel.jpg`.

Use lowercase kebab-case, avoid spaces and duplicate names, and prefer WebP.
Keep the original Shopee product link in the product data; image files are stored
separately from outbound product links.
