import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { isProductCategory } from './data/categories';

const categorySchema = z.string().refine(isProductCategory, {
  message: 'Kategori harus tersedia di koleksi Kategori.',
});
const blogImageSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/images\/blog\/.+/),
]);
const galleryImageSchema = z.union([
  blogImageSchema,
  z.object({
    image: blogImageSchema,
    alt: z.string().trim().min(1),
    caption: z.string().optional(),
  }),
]);
const publishAtSchema = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce.date().optional(),
);
const advancedBlogSettingsSchema = z.object({
  category: categorySchema.optional(),
  publishAt: publishAtSchema,
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  galleryImages: z.array(galleryImageSchema).optional(),
  productIds: z.array(z.string()).optional(),
});

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      heroImage: blogImageSchema,
      category: categorySchema.optional(),
      author: z.string().default('Alfeto'),
      draft: z.boolean().default(false),
      advanced: advancedBlogSettingsSchema.default({}),
      publishAt: publishAtSchema,
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      tags: z.array(z.string()).optional(),
      galleryImages: z.array(galleryImageSchema).optional(),
      productIds: z.array(z.string()).optional(),
    })
    .transform(({ advanced, category, publishAt, seoTitle, seoDescription, tags, galleryImages, productIds, ...post }) => {
      const resolvedCategory = advanced.category ?? category;
      if (!resolvedCategory) {
        throw new Error(`Blog post "${post.title}" must have a category.`);
      }

      return {
        ...post,
        author: 'Alfeto',
        category: resolvedCategory,
        advanced: {
          ...advanced,
          publishAt: advanced.publishAt ?? publishAt,
          seoTitle: advanced.seoTitle ?? seoTitle,
          seoDescription: advanced.seoDescription ?? seoDescription,
          tags: advanced.tags ?? tags ?? [],
          galleryImages: advanced.galleryImages ?? galleryImages ?? [],
          productIds: advanced.productIds ?? productIds ?? [],
        },
      };
    }),
});

const produk = defineCollection({
  loader: glob({ base: './src/data/products', pattern: '**/*.json' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    category: categorySchema,
    image: z.union([z.string().url(), z.string().regex(/^\/images\/products\/.+/)]),
    shopeeUrl: z.string().url(),
    badge: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { blog, produk };
