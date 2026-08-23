import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RequireRole from './components/RequireRole'
import { ToastProvider } from './components/ToastProvider'
import { ThemeProvider } from './context/ThemeContext'
import { DashboardSkeleton } from './components/ui/Skeleton'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SetPasswordPage = lazy(() => import('./pages/admin/SetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ContainersPage = lazy(() => import('./pages/admin/ContainersPage'))
const ProjectsPage = lazy(() => import('./pages/admin/ProjectsPage'))
const DocsPage = lazy(() => import('./pages/admin/DocsPage'))
const PortalManagerPage = lazy(() => import('./pages/admin/PortalManagerPage'))
const FileManagerPage = lazy(() => import('./pages/admin/FileManagerPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const ConsolePage = lazy(() => import('./pages/admin/ConsolePage'))

function PageFallback() {
  return (
    <div className="p-6 space-y-6">
      <DashboardSkeleton />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="docs" element={<DocsPage />} />
              <Route
                path="containers"
                element={
                  <RequireRole allowedRoles={['admin', 'betteradmin', 'superadmin']}>
                    <ContainersPage />
                  </RequireRole>
                }
              />
              <Route
                path="projects"
                element={
                  <RequireRole allowedRoles={['betteradmin', 'superadmin']}>
                    <ProjectsPage />
                  </RequireRole>
                }
              />
              <Route
                path="portal"
                element={
                  <RequireRole allowedRoles={['betteradmin', 'superadmin']}>
                    <PortalManagerPage />
                  </RequireRole>
                }
              />
              <Route
                path="files"
                element={
                  <RequireRole allowedRoles={['betteradmin', 'superadmin']}>
                    <FileManagerPage />
                  </RequireRole>
                }
              />
              <Route
                path="users"
                element={
                  <RequireRole allowedRoles={['superadmin']}>
                    <UsersPage />
                  </RequireRole>
                }
              />
              <Route
                path="console"
                element={
                  <RequireRole allowedRoles={['superadmin']}>
                    <ConsolePage />
                  </RequireRole>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App