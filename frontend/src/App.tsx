import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import ContainersPage from './pages/admin/ContainersPage'
import ProjectsPage from './pages/admin/ProjectsPage'
import DocsPage from './pages/admin/DocsPage'
import ProtectedRoute from './components/ProtectedRoute'
import UsersPage from './pages/admin/UsersPage'
import ConsolePage from './pages/admin/ConsolePage'
import FileManagerPage from './pages/admin/FileManagerPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
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
        <Route path="containers" element={<ContainersPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="console" element={<ConsolePage />} />
        <Route path="files" element={<FileManagerPage />} />
      </Route>
    </Routes>
  )
}

export default App
