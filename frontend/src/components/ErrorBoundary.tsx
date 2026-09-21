import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

/**
 * React error boundary.
 * Catches unhandled render errors and displays a clean error UI
 * rather than crashing the entire application.
 *
 * Error details are NOT exposed to users — only a safe message is shown.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    // Log for debugging — do not expose raw error to user
    console.error('[ErrorBoundary] Caught render error:', error)
    return { hasError: true, errorMessage: 'An unexpected error occurred.' }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production, send to error monitoring (e.g., Sentry) here
    console.error('[ErrorBoundary] Error:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[400px] flex items-center justify-center p-8"
        >
          <div className="card max-w-md w-full p-8 text-center">
            <AlertTriangle
              className="w-12 h-12 text-amber-500 mx-auto mb-4"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-secondary"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

