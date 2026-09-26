import logo from '../../assets/ledgr-logo-primary.svg'

export default function AuthCard({ title, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src={logo} alt="Ledgr" className="mx-auto mb-1 h-12" />
          <div className="text-sm text-slate-500">Inventory Management</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-lg font-semibold">{title}</h1>
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </div>
  )
}
