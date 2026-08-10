import Link         from 'next/link'
import { ProductCard } from './product-card'
import { getRelatedProducts } from '@/features/store/data/products'

type Props = {
  productId:  string
  categoryId: string | null
}

export async function RelatedProducts({ productId, categoryId }: Props) {
  const related = await getRelatedProducts(productId, categoryId, 4)

  if (related.length === 0) return null

  return (
    <section className="mt-16 border-t border-lz-border pt-12">
      <h2 className="mb-6 text-lg font-bold text-lz-text">
        También te puede interesar
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {related.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {categoryId && (
        <div className="mt-8 text-center">
          <Link
            href="/catalog"
            className="text-sm font-medium text-lz-muted underline-offset-4 hover:text-lz-text hover:underline transition-colors"
          >
            Ver todos los productos →
          </Link>
        </div>
      )}
    </section>
  )
}
