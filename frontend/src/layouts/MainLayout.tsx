import { Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'

/**
 * Main application layout.
 * Wraps all pages with the top navigation bar and a consistent
 * page container. The <Outlet /> renders the active route's page.
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main
        id="main-content"
        className="flex-1"
        tabIndex={-1}  // allows skip-to-main-content link to focus this
      >
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} LegalAI — PromptWars Hackathon Project
            </p>
            <p className="text-xs text-slate-400 text-center sm:text-right max-w-md">
              <strong className="text-slate-500">Disclaimer:</strong> LegalAI provides legal{' '}
              <em>information</em>, not legal advice. Always consult a qualified legal
              professional for advice specific to your situation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

