import { cn, CATEGORY_EMOJI } from '@/lib/utils'

interface ProductImageProps {
  src?: string | null
  category?: string
  alt?: string
  className?: string
  emojiClassName?: string
}

export function ProductImage({ src, category = 'OTHER', alt = '', className, emojiClassName = 'text-4xl' }: ProductImageProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn('object-cover w-full h-full', className)} />
    )
  }

  return (
    <div className={cn('flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-50 w-full h-full', className)}>
      <span className={emojiClassName}>{CATEGORY_EMOJI[category] ?? '📦'}</span>
    </div>
  )
}
