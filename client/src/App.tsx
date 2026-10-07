import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { EmailsPage } from './pages/EmailsPage'
import { LoginPage } from './pages/LoginPage'
import { PatientsPage } from './pages/PatientsPage'
import { ShiftsPage } from './pages/ShiftsPage'
import { StaffPage } from './pages/StaffPage'
import { VisitorsPage } from './pages/VisitorsPage'
import { useAuth } from './store/auth'

export default function App() {
  const hydrate = useAuth((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/visitors" element={<VisitorsPage />} />
            <Route path="/shifts" element={<ShiftsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/emails" element={<EmailsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
