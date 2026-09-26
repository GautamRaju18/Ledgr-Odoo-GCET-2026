import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { categories, locations, partners, warehouses } from '../../api/resources'
import CrudPage from '../../components/common/CrudPage'

const text = (label) => z.string().trim().min(1, `Enter ${label}`)
const optional = z
  .string()
  .nullish()
  .transform((v) => v || null)

export function Warehouses() {
  return (
    <CrudPage
      title="Warehouses"
      api={warehouses}
      queryKey="warehouses"
      columns={[
        { key: 'name', label: 'Name', className: 'font-medium' },
        { key: 'short_code', label: 'Short Code' },
        { key: 'address', label: 'Address' },
      ]}
      fields={[
        { name: 'name', label: 'Name' },
        { name: 'short_code', label: 'Short Code' },
        { name: 'address', label: 'Address' },
      ]}
      schema={z.object({
        name: text('a name'),
        short_code: text('a short code').regex(/^[A-Za-z0-9]+$/, 'Letters and digits only'),
        address: optional,
      })}
      defaults={{ name: '', short_code: '', address: '' }}
    />
  )
}

export function Locations() {
  const { data: whs = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouses.list(),
  })
  const warehouseName = (id) => whs.find((w) => w.id === id)?.name ?? '—'
  return (
    <CrudPage
      title="Locations"
      api={locations}
      queryKey="locations"
      rowFilter={(l) => l.type === 'internal'}
      columns={[
        { key: 'full_name', label: 'Name', className: 'font-medium' },
        { key: 'short_code', label: 'Short Code' },
        { key: 'warehouse', label: 'Warehouse', render: (l) => warehouseName(l.warehouse_id) },
      ]}
      fields={[
        { name: 'name', label: 'Name' },
        { name: 'short_code', label: 'Short Code' },
        {
          name: 'warehouse_id',
          label: 'Warehouse',
          options: whs.map((w) => ({ value: w.id, label: w.name })),
        },
      ]}
      schema={z.object({
        name: text('a name'),
        short_code: optional,
        warehouse_id: z.coerce.number({ error: 'Choose a warehouse' }).min(1, 'Choose a warehouse'),
      })}
      defaults={{ name: '', short_code: '', warehouse_id: '' }}
    />
  )
}

export function Categories() {
  return (
    <CrudPage
      title="Product Categories"
      api={categories}
      queryKey="categories"
      columns={[{ key: 'name', label: 'Name', className: 'font-medium' }]}
      fields={[{ name: 'name', label: 'Name' }]}
      schema={z.object({ name: text('a name') })}
      defaults={{ name: '' }}
    />
  )
}

export function Contacts() {
  return (
    <CrudPage
      title="Contacts"
      api={partners}
      queryKey="partners"
      columns={[
        { key: 'name', label: 'Name', className: 'font-medium' },
        {
          key: 'type',
          label: 'Type',
          render: (p) => (p.type === 'vendor' ? 'Vendor' : 'Customer'),
        },
        { key: 'address', label: 'Address' },
      ]}
      fields={[
        { name: 'name', label: 'Name' },
        {
          name: 'type',
          label: 'Type',
          options: [
            { value: 'vendor', label: 'Vendor' },
            { value: 'customer', label: 'Customer' },
          ],
        },
        { name: 'address', label: 'Address' },
      ]}
      schema={z.object({
        name: text('a name'),
        type: z.enum(['vendor', 'customer'], { error: 'Choose a type' }),
        address: optional,
      })}
      defaults={{ name: '', type: 'vendor', address: '' }}
    />
  )
}
