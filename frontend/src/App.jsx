import { Navigate, Route, Routes } from 'react-router'
import { auth } from './api/client'
import AppLayout from './components/layout/AppLayout'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'

function RequireAuth() {
  return auth.token() ? <AppLayout /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={null} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
