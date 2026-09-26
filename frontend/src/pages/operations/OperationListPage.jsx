import { useQuery } from '@tanstack/react-query'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { pickings } from '../../api/pickings'
import { categories, warehouses } from '../../api/resources'
import { cx } from '../../components/common/format'
import { Button, PageHeader, SearchInput, Select } from '../../components/common/ui'
import KanbanBoard from '../../components/operations/KanbanBoard'
import OperationList from '../../components/operations/OperationList'
import { FLOW, KINDS, STATUS } from './kinds'

const FILTERS = ['search', 'status', 'warehouse_id', 'category_id']

export default function OperationListPage({ kind }) {
  const cfg = KINDS[kind]
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') ?? 'list'
  const filters = Object.fromEntries(FILTERS.map((k) => [k, params.get(k) || undefined]))
  const set = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const { data = [], isLoading } = useQuery({
    queryKey: ['pickings', cfg.type, filters],
    queryFn: () => pickings.list({ type: cfg.type, ...filters }),
  })
  const { data: whs = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouses.list(),
  })
  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categories.list(),
  })
  const open = (p) => navigate(`/operations/${kind}/${p.id}`)

  return (
    <>
      <PageHeader title={cfg.title}>
        <Button onClick={() => navigate(`/operations/${kind}/new`)}>
          <Plus className="size-4" /> New
        </Button>
        <SearchInput
          value={filters.search}
          onChange={(v) => set('search', v)}
          placeholder="Reference or contact"
        />
        <Select
          className="w-auto"
          value={filters.status ?? ''}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {[...FLOW[cfg.type], 'canceled'].map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={filters.warehouse_id ?? ''}
          onChange={(e) => set('warehouse_id', e.target.value)}
        >
          <option value="">All warehouses</option>
          {whs.map((w) => (
            <option key={w.id} value={w.id}>
              {w.short_code}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={filters.category_id ?? ''}
          onChange={(e) => set('category_id', e.target.value)}
        >
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <div className="flex rounded-md border border-slate-300 bg-white">
          {[
            ['list', List],
            ['kanban', LayoutGrid],
          ].map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => set('view', name === 'list' ? '' : name)}
              className={cx('p-1.5', view === name ? 'text-brand' : 'text-slate-400')}
              aria-label={`${name} view`}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </PageHeader>
      {view === 'kanban' ? (
        <KanbanBoard type={cfg.type} rows={data} loading={isLoading} onOpen={open} />
      ) : (
        <OperationList rows={data} loading={isLoading} onOpen={open} />
      )}
    </>
  )
}
