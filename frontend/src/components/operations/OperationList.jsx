import { cx, fmtDate } from '../common/format'
import { Badge, Table } from '../common/ui'
import { STATUS, isLate } from '../../pages/operations/kinds'

export default function OperationList({ rows, loading, onOpen }) {
  const columns = [
    { key: 'reference', label: 'Reference', className: 'font-medium' },
    { key: 'source_location_name', label: 'From' },
    { key: 'dest_location_name', label: 'To' },
    { key: 'partner_name', label: 'Contact' },
    {
      key: 'schedule_date',
      label: 'Schedule Date',
      render: (p) => (
        <span className={cx(isLate(p) && 'font-medium text-red-600')}>
          {fmtDate(p.schedule_date)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>,
    },
  ]
  return (
    <Table
      columns={columns}
      rows={rows}
      loading={loading}
      onRowClick={onOpen}
      empty="No operations match these filters"
    />
  )
}
