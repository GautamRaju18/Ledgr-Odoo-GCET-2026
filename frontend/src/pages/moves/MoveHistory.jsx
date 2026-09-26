import { useQuery } from '@tanstack/react-query'
import { LayoutGrid, List } from 'lucide-react'
import { useState } from 'react'
import { moves } from '../../api/resources'
import { OPERATION_TYPES, cx, fmtQty } from '../../components/common/format'
import { Badge, Loading, PageHeader, SearchInput, Select, Table } from '../../components/common/ui'

// Incoming stock green, outgoing red.
const DIRECTION = {
  in: { label: 'Incoming', row: 'bg-green-50/60 text-green-800', tone: 'green', sign: '+' },
  out: { label: 'Outgoing', row: 'bg-red-50/60 text-red-800', tone: 'red', sign: '−' },
  internal: { label: 'Internal', row: '', tone: 'blue', sign: '' },
}

const fmtDateTime = (d) => new Date(d).toLocaleString()
const qty = (m) => `${DIRECTION[m.direction].sign}${fmtQty(m.quantity)} ${m.uom}`

export default function MoveHistory() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [view, setView] = useState('list')
  const params = { search: search || undefined, type: type || undefined }
  const { data = [], isLoading } = useQuery({
    queryKey: ['moves', params],
    queryFn: () => moves.list(params),
  })

  const columns = [
    { key: 'reference', label: 'Reference', className: 'font-medium' },
    { key: 'date', label: 'Date', render: (m) => fmtDateTime(m.date) },
    { key: 'partner_name', label: 'Contact' },
    { key: 'from_location', label: 'From' },
    { key: 'to_location', label: 'To' },
    { key: 'product_name', label: 'Product' },
    { key: 'quantity', label: 'Quantity', className: 'font-medium', render: qty },
    { key: 'status', label: 'Status', render: () => <Badge tone="green">Done</Badge> },
  ]

  return (
    <>
      <PageHeader title="Move History">
        <SearchInput value={search} onChange={setSearch} placeholder="Reference or contact" />
        <Select className="w-auto" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All operations</option>
          {Object.entries(OPERATION_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
              onClick={() => setView(name)}
              className={cx('p-1.5', view === name ? 'text-brand' : 'text-slate-400')}
              aria-label={`${name} view`}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </PageHeader>
      {view === 'list' ? (
        <Table
          columns={columns}
          rows={data}
          loading={isLoading}
          rowClassName={(m) => DIRECTION[m.direction].row}
          empty="No stock moves yet"
        />
      ) : isLoading ? (
        <Loading />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Object.entries(DIRECTION).map(([direction, d]) => {
            const cards = data.filter((m) => m.direction === direction)
            return (
              <div key={direction} className="w-72 shrink-0 rounded-lg bg-slate-100 p-2">
                <div className="mb-2 flex justify-between px-1 text-sm font-medium text-slate-600">
                  {d.label}
                  <span className="text-slate-400">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{m.reference}</span>
                        <Badge tone={d.tone}>{qty(m)}</Badge>
                      </div>
                      <div className="text-slate-600">{m.product_name}</div>
                      <div className="text-xs text-slate-400">
                        {m.from_location} → {m.to_location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
