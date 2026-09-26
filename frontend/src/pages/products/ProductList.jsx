import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { categories, products } from '../../api/resources'
import { fmtMoney, fmtQty } from '../../components/common/format'
import StockBadge from '../../components/common/StockBadge'
import { Button, PageHeader, SearchInput, Select, Table } from '../../components/common/ui'

export default function ProductList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const params = { search: search || undefined, category_id: categoryId || undefined }
  const { data = [], isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => products.list(params),
  })
  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categories.list(),
  })

  const columns = [
    { key: 'sku', label: 'SKU', className: 'font-mono text-xs' },
    { key: 'name', label: 'Name', className: 'font-medium' },
    { key: 'category_name', label: 'Category' },
    { key: 'uom', label: 'Unit' },
    { key: 'per_unit_cost', label: 'Unit Cost', render: (p) => fmtMoney(p.per_unit_cost) },
    { key: 'on_hand', label: 'On Hand', render: (p) => fmtQty(p.on_hand) },
    { key: 'alert', label: '', render: (p) => <StockBadge row={p} /> },
  ]

  return (
    <>
      <PageHeader title="Products">
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="size-4" /> New
        </Button>
        <SearchInput value={search} onChange={setSearch} placeholder="Search SKU or name" />
        <Select
          className="w-auto"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </PageHeader>
      <Table
        columns={columns}
        rows={data}
        loading={isLoading}
        onRowClick={(p) => navigate(`/products/${p.id}`)}
        empty="No products found"
      />
    </>
  )
}
