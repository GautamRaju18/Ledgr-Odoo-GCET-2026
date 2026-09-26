import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Boxes,
  Contact,
  ChevronDown,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Tags,
  Truck,
  User,
  Warehouse,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { auth } from '../../api/client'
import { me } from '../../api/resources'
import { cx } from '../common/format'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/stock', label: 'Stock', icon: Boxes },
  {
    label: 'Operations',
    children: [
      { to: '/operations/receipts', label: 'Receipts', icon: ArrowDownToLine },
      { to: '/operations/deliveries', label: 'Deliveries', icon: Truck },
      { to: '/operations/transfers', label: 'Transfers', icon: ArrowLeftRight },
      { to: '/operations/adjustments', label: 'Adjustments', icon: ClipboardCheck },
    ],
  },
  { to: '/move-history', label: 'Move History', icon: History },
  {
    label: 'Settings',
    children: [
      { to: '/settings/warehouses', label: 'Warehouses', icon: Warehouse },
      { to: '/settings/locations', label: 'Locations', icon: MapPin },
      { to: '/settings/categories', label: 'Categories', icon: Tags },
      { to: '/settings/contacts', label: 'Contacts', icon: Contact },
    ],
  },
]

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm',
          isActive ? 'bg-white/15 font-medium text-white' : 'text-white/75 hover:bg-white/10',
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  )
}

function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: me.get })
  const logout = () => {
    auth.clear()
    navigate('/login')
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-100"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </span>
        <span className="hidden sm:inline">{user?.name}</span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <User className="size-4" /> My Profile
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-slate-50"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)
  return (
    <div className="flex min-h-screen">
      <aside
        className={cx(
          'no-print fixed inset-y-0 left-0 z-30 w-56 shrink-0 bg-brand p-3 md:static md:block',
          menuOpen ? 'block' : 'hidden',
        )}
      >
        <div className="mb-6 px-3 pt-2 text-lg font-bold text-white">StockSense</div>
        <nav className="space-y-1">
          {NAV.map((item) =>
            item.children ? (
              <div key={item.label} className="pt-3">
                <div className="px-3 pb-1 text-xs font-semibold tracking-wide text-white/50 uppercase">
                  {item.label}
                </div>
                {item.children.map((child) => (
                  <NavItem key={child.to} {...child} onClick={close} />
                ))}
              </div>
            ) : (
              <NavItem key={item.to} {...item} onClick={close} />
            ),
          )}
        </nav>
      </aside>
      {menuOpen && <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={close} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <button className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <div className="ml-auto">
            <ProfileMenu />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
