import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorMessage } from '../../api/client'
import { pickings } from '../../api/pickings'
import { locations, partners, products } from '../../api/resources'
import { Button, Card, Field, Input, Loading, Select } from '../../components/common/ui'
import ProductLinesTable from '../../components/operations/ProductLinesTable'
import StatusBar from '../../components/operations/StatusBar'
import { KINDS, today } from './kinds'

const optionalId = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().nullable(),
)
const requiredId = (message) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number({ error: message }))

function makeSchema(cfg) {
  return z
    .object({
      partner_id: optionalId,
      source_location_id: cfg.source ? requiredId('Choose a source location') : optionalId,
      dest_location_id: cfg.dest ? requiredId('Choose a destination location') : optionalId,
      schedule_date: z.string().min(1, 'Pick a date'),
      delivery_address: z
        .string()
        .nullish()
        .transform((v) => v || null),
      lines: z
        .array(
          z.object({
            product_id: requiredId('Choose a product'),
            quantity: z.coerce.number().gt(0, 'Must be more than 0'),
          }),
        )
        .min(1, 'Add at least one product'),
    })
    .refine((v) => !(cfg.source && cfg.dest) || v.source_location_id !== v.dest_location_id, {
      message: 'Source and destination must be different',
      path: ['dest_location_id'],
    })
}

const toForm = (p) => ({
  partner_id: p?.partner_id ?? '',
  source_location_id: p?.source_location_id ?? '',
  dest_location_id: p?.dest_location_id ?? '',
  schedule_date: p?.schedule_date ?? today(),
  delivery_address: p?.delivery_address ?? '',
  lines: p?.lines.map((l) => ({ product_id: l.product_id, quantity: Number(l.quantity) })) ?? [
    { product_id: '', quantity: 1 },
  ],
})

const DONE_MESSAGE = {
  todo: 'Marked as To Do',
  'check-availability': 'Availability checked',
  validate: 'Validated, stock updated',
  cancel: 'Canceled',
}

function OperationForm({ kind, cfg, picking, productList, locationList, partnerList }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const form = useForm({ resolver: zodResolver(makeSchema(cfg)), defaultValues: toForm(picking) })
  const { errors } = form.formState
  const status = picking?.status ?? 'draft'
  const editable = status === 'draft'
  const internal = locationList.filter((l) => l.type === 'internal')
  const contacts = partnerList.filter((c) => !cfg.partnerType || c.type === cfg.partnerType)

  const finish = (p, action) => {
    qc.setQueryData(['picking', String(p.id)], p)
    qc.invalidateQueries()
    form.reset(toForm(p))
    const short = p.lines.filter((l) => l.available === false)
    if (short.length)
      toast.error(`Not enough stock: ${short.map((l) => l.product_name).join(', ')}`)
    else toast.success(action ? DONE_MESSAGE[action] : 'Saved')
    if (!picking) navigate(`/operations/${kind}/${p.id}`, { replace: true })
  }

  const busyWhile = async (work) => {
    setBusy(true)
    try {
      await work()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  // Draft: save the form first, then optionally run an action (To Do).
  const save = (action) =>
    form.handleSubmit((values) =>
      busyWhile(async () => {
        let p = picking
          ? await pickings.update(picking.id, values)
          : await pickings.create({ type: cfg.type, ...values })
        if (action) p = await pickings.action(p.id, action)
        finish(p, action)
      }),
    )()

  const act = (action) => {
    if (action === 'cancel' && !window.confirm('Cancel this operation?')) return
    busyWhile(async () => finish(await pickings.action(picking.id, action), action))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {picking && (
          <Button
            variant="secondary"
            className="no-print"
            onClick={() => navigate(`/operations/${kind}/new`)}
          >
            New
          </Button>
        )}
        <div className="text-sm text-slate-500">
          <Link to={`/operations/${kind}`} className="text-brand hover:underline">
            {cfg.title}
          </Link>{' '}
          / <span className="font-semibold text-slate-800">{picking?.reference ?? 'New'}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-print flex flex-wrap gap-2">
          {editable && (
            <>
              <Button disabled={busy} onClick={() => save('todo')}>
                To Do
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => save()}>
                Save
              </Button>
            </>
          )}
          {status === 'waiting' && (
            <Button disabled={busy} onClick={() => act('check-availability')}>
              Check Availability
            </Button>
          )}
          {status === 'ready' && (
            <Button disabled={busy} onClick={() => act('validate')}>
              Validate
            </Button>
          )}
          {status === 'done' && (
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
          )}
          {picking && ['draft', 'waiting', 'ready'].includes(status) && (
            <Button variant="danger" disabled={busy} onClick={() => act('cancel')}>
              Cancel
            </Button>
          )}
        </div>
        <StatusBar type={cfg.type} status={status} />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">{picking?.reference ?? `New ${cfg.single}`}</h2>
        <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2">
          <Field label={cfg.partnerLabel} error={errors.partner_id}>
            <Select {...form.register('partner_id')}>
              <option value="">—</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          {cfg.source && (
            <Field label="Source Location" error={errors.source_location_id}>
              <LocationSelect locations={internal} {...form.register('source_location_id')} />
            </Field>
          )}
          {cfg.dest && (
            <Field label="Destination Location" error={errors.dest_location_id}>
              <LocationSelect locations={internal} {...form.register('dest_location_id')} />
            </Field>
          )}
          <Field label="Schedule Date" error={errors.schedule_date}>
            <Input type="date" {...form.register('schedule_date')} />
          </Field>
          {cfg.type === 'delivery' && (
            <Field label="Delivery Address" error={errors.delivery_address}>
              <Input {...form.register('delivery_address')} />
            </Field>
          )}
          <Field label="Responsible">
            <Input value={picking?.responsible_name ?? 'You'} readOnly disabled />
          </Field>
          <Field label="Operation Type">
            <Input value={cfg.single} readOnly disabled />
          </Field>
        </fieldset>
      </Card>

      <h3 className="font-semibold text-slate-700">Products</h3>
      <ProductLinesTable
        form={form}
        products={productList}
        editable={editable}
        available={picking?.lines.map((l) => l.available)}
      />
    </div>
  )
}

const LocationSelect = ({ locations, ...props }) => (
  <Select {...props}>
    <option value="">Select location…</option>
    {locations.map((l) => (
      <option key={l.id} value={l.id}>
        {l.full_name}
      </option>
    ))}
  </Select>
)

export default function OperationFormPage({ kind }) {
  const cfg = KINDS[kind]
  const { id } = useParams()
  const isNew = id === 'new'
  const picking = useQuery({
    queryKey: ['picking', id],
    queryFn: () => pickings.get(id),
    enabled: !isNew,
  })
  const productList = useQuery({ queryKey: ['products'], queryFn: () => products.list() })
  const locationList = useQuery({ queryKey: ['locations'], queryFn: () => locations.list() })
  const partnerList = useQuery({ queryKey: ['partners'], queryFn: () => partners.list() })

  const queries = [productList, locationList, partnerList, ...(isNew ? [] : [picking])]
  if (queries.some((q) => q.isLoading)) return <Loading />
  if (!isNew && picking.isError) return <p className="text-slate-500">Operation not found.</p>
  return (
    <OperationForm
      key={isNew ? 'new' : `${id}-${picking.data.status}`}
      kind={kind}
      cfg={cfg}
      picking={isNew ? null : picking.data}
      productList={productList.data}
      locationList={locationList.data}
      partnerList={partnerList.data}
    />
  )
}
