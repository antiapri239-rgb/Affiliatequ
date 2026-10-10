export interface CategoryOption {
  id: string;
  title: string;
}

export type ProductCategory = string;

const categoryFiles = import.meta.glob<CategoryOption>('./category-options/*.json', {
  eager: true,
  import: 'default',
});

export const categories = Object.values(categoryFiles);
const categoryIds = new Set<string>();

for (const category of categories) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.id)) {
    throw new Error(`Category "${category.title}" has an invalid ID "${category.id}".`);
  }

  if (!category.title.trim()) {
    throw new Error(`Category "${category.id}" must have a name.`);
  }

  if (categoryIds.has(category.id)) {
    throw new Error(`Duplicate category ID "${category.id}".`);
  }

  categoryIds.add(category.id);
}

export const productCategories = categories.map(({ id }) => id);
export const categoryLabels: Record<string, string> = {};

for (const { id, title } of categories) {
  categoryLabels[id] = title;
}

export function isProductCategory(value: string): value is ProductCategory {
  return categoryIds.has(value);
}
