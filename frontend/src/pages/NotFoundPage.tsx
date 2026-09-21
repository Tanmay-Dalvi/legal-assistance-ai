import { Link } from 'react-router-dom'
import { Scale, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div
      role="main"
      aria-labelledby="not-found-heading"
      className="min-h-[60vh] flex items-center justify-center px-4 py-20"
    >
      <div className="text-center max-w-md animate-slide-up">
        <Scale className="w-16 h-16 text-brand-200 mx-auto mb-6" aria-hidden="true" />
        <h1
          id="not-found-heading"
          className="text-6xl font-bold text-brand-600 mb-4"
          aria-label="404 Page not found"
        >
          404
        </h1>
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Page Not Found</h2>
        <p className="text-slate-600 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn-primary">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}

