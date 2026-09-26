import { Navigate, Route, Routes } from 'react-router'
import { auth } from './api/client'
import AppLayout from './components/layout/AppLayout'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Dashboard from './pages/dashboard/Dashboard'
import MoveHistory from './pages/moves/MoveHistory'
import { KINDS } from './pages/operations/kinds'
import OperationFormPage from './pages/operations/OperationFormPage'
import OperationListPage from './pages/operations/OperationListPage'
import ProductForm from './pages/products/ProductForm'
import ProductList from './pages/products/ProductList'
import Profile from './pages/profile/Profile'
import { Categories, Contacts, Locations, Warehouses } from './pages/settings/Settings'
import Adjustments from './pages/stock/Adjustments'
import Stock from './pages/stock/Stock'

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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductForm />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/operations/adjustments" element={<Adjustments />} />
        <Route path="/move-history" element={<MoveHistory />} />
        <Route path="/settings/warehouses" element={<Warehouses />} />
        <Route path="/settings/locations" element={<Locations />} />
        <Route path="/settings/categories" element={<Categories />} />
        <Route path="/settings/contacts" element={<Contacts />} />
        <Route path="/profile" element={<Profile />} />
        {Object.keys(KINDS).map((kind) => [
          <Route
            key={kind}
            path={`/operations/${kind}`}
            element={<OperationListPage key={kind} kind={kind} />}
          />,
          <Route
            key={`${kind}-form`}
            path={`/operations/${kind}/:id`}
            element={<OperationFormPage key={kind} kind={kind} />}
          />,
        ])}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
