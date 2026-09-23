import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import AnalysisPage from '@/pages/AnalysisPage'
import ComparisonPage from '@/pages/ComparisonPage'
import QAPage from '@/pages/QAPage'
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
            <Route path="/analyze/:documentId" element={<AnalysisPage />} />
            <Route path="/compare" element={<ComparisonPage />} />
            <Route path="/qa/:documentId" element={<QAPage />} />
            {/* Future routes:
              <Route path="/summary/:id" element={<SummaryPage />} />
            */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

