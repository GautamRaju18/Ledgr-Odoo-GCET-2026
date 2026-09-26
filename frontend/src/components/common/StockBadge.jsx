import { Badge } from './ui'

/** Red/amber alert badge for products that are out of or low on stock. */
export default function StockBadge({ row }) {
  if (row.out_of_stock) return <Badge tone="red">Out of stock</Badge>
  if (row.low_stock) return <Badge tone="amber">Low stock</Badge>
  return null
}
