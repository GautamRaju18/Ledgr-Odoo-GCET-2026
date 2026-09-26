import { Navigate, Route, Routes } from 'react-router'
import { auth } from './api/client'
import AppLayout from './components/layout/AppLayout'

function RequireAuth() {
  return auth.token() ? <AppLayout /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={null} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
