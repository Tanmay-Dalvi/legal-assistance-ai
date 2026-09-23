import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface StatusBadgeProps {
  status: 'ready' | 'processing' | 'failed' | 'uploaded' | 'indexed' | 'not-indexed'
  label?: string
}

const STATUS_CONFIG = {
  ready: { label: 'READY', className: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  indexed: { label: 'INDEXED', className: 'bg-blue-50 text-blue-800 border-blue-200', icon: CheckCircle2 },
  processing: { label: 'PROCESSING', className: 'bg-amber-50 text-amber-900 border-amber-200', icon: LoaderCircle },
  uploaded: { label: 'UPLOADED', className: 'bg-slate-100 text-slate-700 border-slate-200', icon: LoaderCircle },
  'not-indexed': { label: 'NOT INDEXED', className: 'bg-slate-100 text-slate-700 border-slate-200', icon: CircleAlert },
  failed: { label: 'FAILED', className: 'bg-red-50 text-red-800 border-red-200', icon: CircleAlert },
} as const

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide', config.className)}>
      <Icon className={clsx('h-3.5 w-3.5', status === 'processing' || status === 'uploaded' ? 'animate-spin' : '')} aria-hidden="true" />
      {label || config.label}
    </span>
  )
}
