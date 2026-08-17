import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import ContainersPage from './pages/admin/ContainersPage'
import ProjectsPage from './pages/admin/ProjectsPage'
import DocsPage from './pages/admin/DocsPage'
import ProtectedRoute from './components/ProtectedRoute'
import RequireRole from './components/RequireRole'
import UsersPage from './pages/admin/UsersPage'
import ConsolePage from './pages/admin/ConsolePage'
import FileManagerPage from './pages/admin/FileManagerPage'
import SetPasswordPage from './pages/admin/SetPasswordPage'
import PortalManagerPage from './pages/admin/PortalManagerPage'
import { ToastProvider } from './components/ToastProvider'

function App() {
  return (
  <ToastProvider>
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
        <Route path="containers" element={
          <RequireRole allowedRoles={['admin', 'betteradmin', 'superadmin']}>
            <ContainersPage />
          </RequireRole>
        } />
        <Route path="projects" element={
          <RequireRole allowedRoles={['betteradmin', 'superadmin']}>
            <ProjectsPage />
          </RequireRole>
        } />
        <Route path="portal" element={
          <RequireRole allowedRoles={['betteradmin', 'superadmin']}>
            <PortalManagerPage />
          </RequireRole>
        } />
        <Route path="files" element={
          <RequireRole allowedRoles={['betteradmin', 'superadmin']}>
            <FileManagerPage />
          </RequireRole>
        } />

        <Route path="users" element={
          <RequireRole allowedRoles={['superadmin']}>
            <UsersPage />
          </RequireRole>
        } />
        <Route path="console" element={
          <RequireRole allowedRoles={['superadmin']}>
            <ConsolePage />
          </RequireRole>
        } />
        
      </Route>
    </Routes>
    </ToastProvider>
  )
}

export default App