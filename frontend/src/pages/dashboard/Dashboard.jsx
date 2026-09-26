import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  PackageX,
  Truck,
  ArrowDownToLine,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { categories, dashboard, locations, warehouses } from '../../api/resources'
import { cx } from '../../components/common/format'
import { Card, Loading, PageHeader, Select } from '../../components/common/ui'

function Kpi({ label, value, icon: Icon, tone = 'text-brand', to }) {
  return (
    <Link to={to}>
      <Card className="flex items-center gap-4 transition hover:border-brand">
        <Icon className={cx('size-8', tone)} />
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
        </div>
      </Card>
    </Link>
  )
}

function OperationCard({ title, card, verb, to }) {
  const stat = (label, value, tone) => (
    <div className={cx('text-sm', value ? tone : 'text-slate-400')}>
      <span className="font-semibold">{value}</span> {label}
    </div>
  )
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <h2 className="mb-3 font-semibold">{title}</h2>
        <Link
          to={to}
          className="inline-block rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {card.pending} to {verb}
        </Link>
      </div>
      <div className="space-y-1 text-right">
        {stat('Late', card.late, 'text-red-600')}
        {card.waiting !== undefined && stat('Waiting', card.waiting, 'text-amber-600')}
        {stat('Operations', card.upcoming, 'text-slate-700')}
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const [filters, setFilters] = useState({})
  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value || undefined })
  const { data: k, isLoading } = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () => dashboard.kpis(filters),
  })
  const { data: whs = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouses.list(),
  })
  const { data: locs = [] } = useQuery({ queryKey: ['locations'], queryFn: () => locations.list() })
  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categories.list(),
  })

  return (
    <>
      <PageHeader title="Inventory Dashboard">
        <Select className="w-auto" onChange={set('warehouse_id')}>
          <option value="">All warehouses</option>
          {whs.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Select className="w-auto" onChange={set('location_id')}>
          <option value="">All locations</option>
          {locs
            .filter((l) => l.type === 'internal')
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.full_name}
              </option>
            ))}
        </Select>
        <Select className="w-auto" onChange={set('category_id')}>
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </PageHeader>
      {isLoading || !k ? (
        <Loading />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              label="Products in Stock"
              value={k.total_products_in_stock}
              icon={Boxes}
              to="/stock"
            />
            <Kpi
              label="Low Stock Items"
              value={k.low_stock}
              icon={AlertTriangle}
              tone="text-amber-500"
              to="/products"
            />
            <Kpi
              label="Out of Stock Items"
              value={k.out_of_stock}
              icon={PackageX}
              tone="text-red-500"
              to="/products"
            />
            <Kpi
              label="Pending Receipts"
              value={k.pending_receipts}
              icon={ArrowDownToLine}
              to="/operations/receipts"
            />
            <Kpi
              label="Pending Deliveries"
              value={k.pending_deliveries}
              icon={Truck}
              to="/operations/deliveries"
            />
            <Kpi
              label="Internal Transfers Scheduled"
              value={k.internal_transfers_scheduled}
              icon={ArrowLeftRight}
              to="/operations/transfers"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <OperationCard
              title="Receipts"
              card={{ ...k.receipts, waiting: undefined }}
              verb="receive"
              to="/operations/receipts"
            />
            <OperationCard
              title="Delivery Orders"
              card={k.deliveries}
              verb="deliver"
              to="/operations/deliveries"
            />
          </div>
        </div>
      )}
    </>
  )
}
