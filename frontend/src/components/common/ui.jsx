import { Loader2, Search } from 'lucide-react'
import { cx } from './format'

const BUTTON = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

export function Button({ variant = 'primary', type = 'button', className, ...props }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON[variant],
        className,
      )}
      {...props}
    />
  )
}

const FIELD =
  'rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none disabled:bg-slate-100 disabled:text-slate-500'

// Full width unless the caller sets its own width (two w-* classes would clash).
const field = (className) => cx(FIELD, !/(^|\s)w-/.test(className ?? '') && 'w-full', className)

export const Input = ({ className, ...props }) => <input className={field(className)} {...props} />

export const Select = ({ className, children, ...props }) => (
  <select className={field(className)} {...props}>
    {children}
  </select>
)

export function Field({ label, error, children, className }) {
  return (
    <label className={cx('block space-y-1', className)}>
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error.message ?? error}</span>}
    </label>
  )
}

const TONE = {
  gray: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
}

export const Badge = ({ tone = 'gray', children }) => (
  <span className={cx('inline-block rounded-full px-2 py-0.5 text-xs font-medium', TONE[tone])}>
    {children}
  </span>
)

export const Card = ({ className, children }) => (
  <div className={cx('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
    {children}
  </div>
)

export function PageHeader({ title, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export const Loading = () => (
  <div className="flex justify-center py-10 text-slate-400">
    <Loader2 className="animate-spin" />
  </div>
)

export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <Search className="absolute top-2 left-2.5 size-4 text-slate-400" />
      <Input
        className="w-56 pl-8"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

/** columns: [{key, label, render?, className?}] */
export function Table({
  columns,
  rows,
  loading,
  onRowClick,
  rowClassName,
  empty = 'Nothing here yet',
}) {
  if (loading) return <Loading />
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cx('px-3 py-2 font-medium', c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-slate-400">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={onRowClick && (() => onRowClick(row))}
              className={cx(onRowClick && 'cursor-pointer hover:bg-slate-50', rowClassName?.(row))}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx('px-3 py-2', c.className)}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
