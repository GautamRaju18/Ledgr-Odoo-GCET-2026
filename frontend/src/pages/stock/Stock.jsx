import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorMessage } from '../../api/client'
import { categories, locations, stock, warehouses } from '../../api/resources'
import { fmtMoney, fmtQty } from '../../components/common/format'
import StockBadge from '../../components/common/StockBadge'
import { Input, PageHeader, SearchInput, Select, Table } from '../../components/common/ui'

const countSchema = z.object({
  counted: z.coerce.number({ error: 'Enter a number' }).min(0, 'Cannot be negative'),
})

/** Inline "update stock": the counted quantity becomes on hand via an adjustment. */
function AdjustForm({ row, onDone }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(countSchema),
    defaultValues: { counted: Number(row.on_hand) },
  })
  const onSubmit = async ({ counted }) => {
    try {
      const { reference } = await stock.adjust({
        product_id: row.product_id,
        location_id: row.location_id,
        counted_quantity: counted,
      })
      toast.success(reference ? `Stock updated (${reference})` : 'No change')
      qc.invalidateQueries()
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        min="0"
        autoFocus
        className="w-24"
        aria-label="Counted quantity"
        {...register('counted')}
      />
      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="text-green-600"
        aria-label="Save"
      >
        <Check className="size-4" />
      </button>
      <button type="button" onClick={onDone} className="text-slate-400" aria-label="Cancel">
        <X className="size-4" />
      </button>
      {formState.errors.counted && (
        <span className="text-xs text-red-600">{formState.errors.counted.message}</span>
      )}
    </form>
  )
}

export default function Stock() {
  const [filters, setFilters] = useState({})
  const [editing, setEditing] = useState(null)
  const set = (key) => (value) => setFilters({ ...filters, [key]: value || undefined })
  const { data = [], isLoading } = useQuery({
    queryKey: ['stock', filters],
    queryFn: () => stock.list(filters),
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
  const key = (r) => `${r.product_id}-${r.location_id}`

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (r) => (
        <>
          <div className="font-medium">{r.product_name}</div>
          <div className="font-mono text-xs text-slate-400">{r.sku}</div>
        </>
      ),
    },
    { key: 'location_name', label: 'Location' },
    { key: 'per_unit_cost', label: 'Per Unit Cost', render: (r) => fmtMoney(r.per_unit_cost) },
    {
      key: 'on_hand',
      label: 'On Hand',
      render: (r) =>
        editing === key(r) ? (
          <AdjustForm row={r} onDone={() => setEditing(null)} />
        ) : (
          <button
            onClick={() => setEditing(key(r))}
            className="group inline-flex items-center gap-1.5"
            title="Update stock"
          >
            {fmtQty(r.on_hand)} {r.uom}
            <Pencil className="size-3.5 text-slate-300 group-hover:text-brand" />
          </button>
        ),
    },
    {
      key: 'free_to_use',
      label: 'Free to Use',
      render: (r) => `${fmtQty(r.free_to_use)} ${r.uom}`,
    },
    { key: 'alert', label: '', render: (r) => <StockBadge row={r} /> },
  ]

  const select = (name, label, options) => (
    <Select className="w-auto" onChange={(e) => set(name)(e.target.value)}>
      <option value="">{label}</option>
      {options.map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </Select>
  )

  return (
    <>
      <PageHeader title="Stock">
        <SearchInput
          value={filters.search}
          onChange={set('search')}
          placeholder="Search SKU or name"
        />
        {select(
          'warehouse_id',
          'All warehouses',
          whs.map((w) => [w.id, w.name]),
        )}
        {select(
          'location_id',
          'All locations',
          locs.filter((l) => l.type === 'internal').map((l) => [l.id, l.full_name]),
        )}
        {select(
          'category_id',
          'All categories',
          cats.map((c) => [c.id, c.name]),
        )}
      </PageHeader>
      <Table
        columns={columns}
        rows={data.map((r) => ({ ...r, id: key(r) }))}
        loading={isLoading}
        empty="No stock yet. Validate a receipt or set initial stock on a product."
      />
    </>
  )
}
