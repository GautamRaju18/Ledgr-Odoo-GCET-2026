import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorMessage } from '../../api/client'
import { categories, locations, products, reorderRules, warehouses } from '../../api/resources'
import { fmtQty } from '../../components/common/format'
import StockBadge from '../../components/common/StockBadge'
import { Button, Card, Field, Input, Loading, Select, Table } from '../../components/common/ui'

const blankToUndefined = (v) => (v === '' || v == null ? undefined : v)
const optionalId = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().nullable(),
)
const qty = (message) => z.preprocess(blankToUndefined, z.coerce.number({ error: message }))

const productSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  sku: z.string().trim().min(1, 'Enter a SKU').regex(/^\S+$/, 'No spaces'),
  category_id: optionalId,
  uom: z.string().trim().min(1, 'Enter a unit, e.g. Units or kg'),
  per_unit_cost: qty('Enter a cost').pipe(z.number().min(0, 'Cannot be negative')),
})

const newProductSchema = productSchema
  .extend({
    initial_stock: z.preprocess(
      blankToUndefined,
      z.coerce.number().gt(0, 'Must be more than 0').optional(),
    ),
    location_id: optionalId,
  })
  .refine((v) => !v.initial_stock || v.location_id, {
    message: 'Choose where the initial stock is',
    path: ['location_id'],
  })

const ruleSchema = z
  .object({
    warehouse_id: z.preprocess(blankToUndefined, z.coerce.number({ error: 'Choose a warehouse' })),
    min_qty: qty('Enter a minimum').pipe(z.number().min(0, 'Cannot be negative')),
    max_qty: qty('Enter a maximum').pipe(z.number().min(0, 'Cannot be negative')),
  })
  .refine((v) => v.min_qty <= v.max_qty, { message: 'Min exceeds max', path: ['max_qty'] })

function ReorderRules({ product, whs }) {
  const qc = useQueryClient()
  const form = useForm({ resolver: zodResolver(ruleSchema) })
  const { errors } = form.formState
  const run = async (work, message) => {
    try {
      await work()
      toast.success(message)
      qc.invalidateQueries()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  const add = (values) =>
    run(async () => {
      await reorderRules.create({ ...values, product_id: product.id })
      form.reset({ warehouse_id: '', min_qty: '', max_qty: '' })
    }, 'Reorder rule added')
  const whName = (id) => whs.find((w) => w.id === id)?.name
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Reordering Rules</h2>
      <Table
        columns={[
          { key: 'warehouse', label: 'Warehouse', render: (r) => whName(r.warehouse_id) },
          { key: 'min_qty', label: 'Min Qty', render: (r) => fmtQty(r.min_qty) },
          { key: 'max_qty', label: 'Max Qty', render: (r) => fmtQty(r.max_qty) },
          {
            key: 'delete',
            label: '',
            className: 'w-10',
            render: (r) => (
              <button
                onClick={() => run(() => reorderRules.remove(r.id), 'Reorder rule removed')}
                className="text-slate-400 hover:text-red-600"
                aria-label="Delete rule"
              >
                <Trash2 className="size-4" />
              </button>
            ),
          },
        ]}
        rows={product.reorder_rules}
        empty="No reordering rules. Low stock alerts need one."
      />
      <form
        noValidate
        onSubmit={form.handleSubmit(add)}
        className="mt-3 grid items-end gap-3 sm:grid-cols-4"
      >
        <Field label="Warehouse" error={errors.warehouse_id}>
          <Select {...form.register('warehouse_id')}>
            <option value="">—</option>
            {whs.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Min Qty" error={errors.min_qty}>
          <Input type="number" step="0.01" {...form.register('min_qty')} />
        </Field>
        <Field label="Max Qty" error={errors.max_qty}>
          <Input type="number" step="0.01" {...form.register('max_qty')} />
        </Field>
        <Button type="submit" variant="secondary">
          Add rule
        </Button>
      </form>
    </Card>
  )
}

function ProductFields({ product, cats, locs }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isNew = !product
  const form = useForm({
    resolver: zodResolver(isNew ? newProductSchema : productSchema),
    defaultValues: product
      ? { ...product, category_id: product.category_id ?? '' }
      : { name: '', sku: '', category_id: '', uom: 'Units', per_unit_cost: 0 },
  })
  const { errors, isSubmitting } = form.formState
  const onSubmit = async (values) => {
    try {
      const saved = isNew
        ? await products.create(values)
        : await products.update(product.id, values)
      qc.invalidateQueries()
      toast.success('Product saved')
      if (isNew) navigate(`/products/${saved.id}`, { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  return (
    <Card>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Product Name" error={errors.name}>
          <Input {...form.register('name')} />
        </Field>
        <Field label="SKU / Code" error={errors.sku}>
          <Input {...form.register('sku')} />
        </Field>
        <Field label="Category" error={errors.category_id}>
          <Select {...form.register('category_id')}>
            <option value="">—</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unit of Measure" error={errors.uom}>
          <Input list="uoms" {...form.register('uom')} />
          <datalist id="uoms">
            {['Units', 'kg', 'g', 'L', 'm', 'Box'].map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>
        <Field label="Per Unit Cost" error={errors.per_unit_cost}>
          <Input type="number" step="0.01" min="0" {...form.register('per_unit_cost')} />
        </Field>
        {isNew && (
          <>
            <Field label="Initial Stock (optional)" error={errors.initial_stock}>
              <Input type="number" step="0.01" min="0" {...form.register('initial_stock')} />
            </Field>
            <Field label="Initial Stock Location" error={errors.location_id}>
              <Select {...form.register('location_id')}>
                <option value="">—</option>
                {locs
                  .filter((l) => l.type === 'internal')
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.full_name}
                    </option>
                  ))}
              </Select>
            </Field>
          </>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default function ProductForm() {
  const { id } = useParams()
  const isNew = id === 'new'
  const product = useQuery({
    queryKey: ['product', id],
    queryFn: () => products.get(id),
    enabled: !isNew,
  })
  const cats = useQuery({ queryKey: ['categories'], queryFn: () => categories.list() })
  const locs = useQuery({ queryKey: ['locations'], queryFn: () => locations.list() })
  const whs = useQuery({ queryKey: ['warehouses'], queryFn: () => warehouses.list() })
  if ([product, cats, locs, whs].some((q) => q.isLoading)) return <Loading />
  if (!isNew && product.isError) return <p className="text-slate-500">Product not found.</p>
  const p = isNew ? null : product.data

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link to="/products" className="text-brand hover:underline">
          Products
        </Link>
        / <span className="font-semibold text-slate-800">{p?.name ?? 'New'}</span>
        {p && <StockBadge row={p} />}
      </div>
      <ProductFields key={p?.id ?? 'new'} product={p} cats={cats.data} locs={locs.data} />
      {p && (
        <>
          <Card>
            <h2 className="mb-3 font-semibold">
              Stock by Location · {fmtQty(p.on_hand)} {p.uom} on hand
            </h2>
            <Table
              columns={[
                { key: 'location_name', label: 'Location' },
                { key: 'on_hand', label: 'On Hand', render: (r) => fmtQty(r.on_hand) },
                { key: 'free_to_use', label: 'Free to Use', render: (r) => fmtQty(r.free_to_use) },
              ]}
              rows={p.stock}
              empty="No stock yet"
            />
          </Card>
          <ReorderRules product={p} whs={whs.data} />
        </>
      )}
    </div>
  )
}
