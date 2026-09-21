import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  /** Visual size of the spinner */
  size?: 'sm' | 'md' | 'lg'
  /** Accessible description for screen readers */
  label?: string
  /** Display the label text visibly beside the spinner */
  showLabel?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
}

/**
 * Accessible loading spinner.
 * Always includes an sr-only label for screen readers.
 */
export default function LoadingSpinner({
  size = 'md',
  label = 'Loading…',
  showLabel = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={clsx('flex items-center gap-3', className)}
    >
      <span
        className={clsx(
          'inline-block rounded-full border-brand-200 border-t-brand-500 animate-spin',
          SIZE_CLASSES[size]
        )}
        aria-hidden="true"
      />
      {showLabel ? (
        <span className="text-sm text-slate-600">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  )
}

