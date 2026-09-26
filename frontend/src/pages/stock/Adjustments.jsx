import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorMessage } from '../../api/client'
import { locations, moves, products, stock } from '../../api/resources'
import { cx, fmtQty } from '../../components/common/format'
import { Button, Card, Field, Input, PageHeader, Select, Table } from '../../components/common/ui'

const requiredId = (message) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number({ error: message }))

const schema = z.object({
  product_id: requiredId('Choose a product'),
  location_id: requiredId('Choose a location'),
  counted_quantity: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.number({ error: 'Enter the counted quantity' }).min(0, 'Cannot be negative'),
  ),
})

/** Physical count for any product at any location; the difference is logged as WH/ADJ/xxxx. */
function CountForm({ productList, locationList }) {
  const qc = useQueryClient()
  const form = useForm({ resolver: zodResolver(schema) })
  const { errors, isSubmitting } = form.formState
  const [productId, locationId] = useWatch({
    control: form.control,
    name: ['product_id', 'location_id'],
  })
  const { data: rows = [] } = useQuery({
    queryKey: ['stock', { location_id: locationId }],
    queryFn: () => stock.list({ location_id: locationId }),
    enabled: Boolean(locationId),
  })
  const product = productList.find((p) => p.id === Number(productId))
  const recorded = rows.find((r) => r.product_id === Number(productId))?.on_hand ?? 0

  const onSubmit = async (values) => {
    try {
      const { reference } = await stock.adjust(values)
      toast.success(reference ? `Stock updated (${reference})` : 'Count matches, no change')
      qc.invalidateQueries()
      form.setValue('counted_quantity', '')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Card>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid items-end gap-3 sm:grid-cols-4"
      >
        <Field label="Product" error={errors.product_id}>
          <Select {...form.register('product_id')}>
            <option value="">Select product…</option>
            {productList.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.sku}] {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Location" error={errors.location_id}>
          <Select {...form.register('location_id')}>
            <option value="">Select location…</option>
            {locationList
              .filter((l) => l.type === 'internal')
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Counted Quantity" error={errors.counted_quantity}>
          <Input type="number" step="0.01" min="0" {...form.register('counted_quantity')} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          Apply
        </Button>
        {product && locationId && (
          <p className="text-sm text-slate-500 sm:col-span-4">
            Recorded stock: {fmtQty(recorded)} {product.uom}
          </p>
        )}
      </form>
    </Card>
  )
}

export default function Adjustments() {
  const productList = useQuery({ queryKey: ['products'], queryFn: () => products.list() })
  const locationList = useQuery({ queryKey: ['locations'], queryFn: () => locations.list() })
  const history = useQuery({
    queryKey: ['moves', { type: 'adjustment' }],
    queryFn: () => moves.list({ type: 'adjustment' }),
  })

  const columns = [
    { key: 'reference', label: 'Reference', className: 'font-medium' },
    { key: 'date', label: 'Date', render: (m) => new Date(m.date).toLocaleString() },
    { key: 'product_name', label: 'Product' },
    {
      key: 'location',
      label: 'Location',
      render: (m) => (m.direction === 'in' ? m.to_location : m.from_location),
    },
    {
      key: 'quantity',
      label: 'Change',
      render: (m) => (
        <span
          className={cx('font-medium', m.direction === 'in' ? 'text-green-700' : 'text-red-700')}
        >
          {m.direction === 'in' ? '+' : '−'}
          {fmtQty(m.quantity)} {m.uom}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Inventory Adjustments" />
      {productList.data && locationList.data && (
        <CountForm productList={productList.data} locationList={locationList.data} />
      )}
      <Table
        columns={columns}
        rows={history.data ?? []}
        loading={history.isLoading}
        empty="No adjustments yet"
      />
    </div>
  )
}
