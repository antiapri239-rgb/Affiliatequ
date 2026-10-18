import { categoryLabels, isProductCategory, type ProductCategory } from './categories';

export { categoryLabels, productCategories, type ProductCategory } from './categories';

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  image: string;
  shopeeUrl: string;
  badge?: string;
  description?: string;
}

interface ProductFile extends Omit<Product, 'title' | 'category'> {
  title?: string;
  category?: ProductCategory;
  productDetails?: {
    title?: string;
    category?: ProductCategory;
    description?: string;
  };
}

const productFiles = import.meta.glob<ProductFile>('./products/*.json', {
  eager: true,
  import: 'default',
});

export const products: Product[] = Object.values(productFiles).map((source, index) => {
  const title = source.productDetails?.title ?? source.title;
  const category = source.productDetails?.category ?? source.category;
  const description = source.productDetails?.description ?? source.description;

  if (!title) {
    throw new Error(`Product ${index + 1} is missing a title.`);
  }

  if (!category || !isProductCategory(category)) {
    throw new Error(`Product ${index + 1} has an unsupported category "${category}".`);
  }

  const { productDetails, ...product } = source;
  return {
    ...product,
    title,
    category,
    ...(description ? { description } : {}),
  };
});
