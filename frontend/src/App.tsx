import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * App root — sets up the router tree.
 * Features are implemented as separate routes under MainLayout.
 * Future routes (Analysis, Comparison, Q&A) will be added here.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            {/* Future routes:
              <Route path="/analyze" element={<AnalysisPage />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/qa" element={<QAPage />} />
              <Route path="/summary/:id" element={<SummaryPage />} />
            */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

