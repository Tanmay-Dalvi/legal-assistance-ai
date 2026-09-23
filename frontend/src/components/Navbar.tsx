import { Link, NavLink } from 'react-router-dom'
import { Scale, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/compare', label: 'Compare' },
]

/**
 * Top navigation bar.
 * Accessible: includes skip-to-content link, ARIA labels, keyboard nav.
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      {/* Skip to main content — visible only on focus (accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4
                   focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white
                   focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-brand-700 hover:text-brand-800 transition-colors"
            aria-label="LegalAI — home"
          >
            <Scale className="w-6 h-6" aria-hidden="true" />
            <span className="font-semibold text-lg tracking-tight">LegalAI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <div key={to} className="relative">
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                    )
                  }
                >
                  {label}
                </NavLink>
              </div>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden btn-ghost p-2"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile nav panel */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-fade-in">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}

