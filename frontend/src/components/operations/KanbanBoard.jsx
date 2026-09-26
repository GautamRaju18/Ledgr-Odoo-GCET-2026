import { cx, fmtDate } from '../common/format'
import { Loading } from '../common/ui'
import { FLOW, STATUS, isLate } from '../../pages/operations/kinds'

export default function KanbanBoard({ type, rows, loading, onOpen }) {
  if (loading) return <Loading />
  const columns = [...FLOW[type], 'canceled']
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((status) => {
        const cards = rows.filter((p) => p.status === status)
        return (
          <div key={status} className="w-64 shrink-0 rounded-lg bg-slate-100 p-2">
            <div className="mb-2 flex justify-between px-1 text-sm font-medium text-slate-600">
              {STATUS[status].label}
              <span className="text-slate-400">{cards.length}</span>
            </div>
            <div className="space-y-2">
              {cards.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpen(p)}
                  className="block w-full rounded-md border border-slate-200 bg-white p-3 text-left text-sm shadow-sm hover:border-brand"
                >
                  <div className="font-medium">{p.reference}</div>
                  <div className="text-slate-500">{p.partner_name ?? p.dest_location_name}</div>
                  <div className={cx('text-xs', isLate(p) ? 'text-red-600' : 'text-slate-400')}>
                    {fmtDate(p.schedule_date)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
