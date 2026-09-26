import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'
import { cx } from '../common/format'
import { Button, Input, Select } from '../common/ui'

/** Editable product lines. `available[i] === false` marks line i red (not enough stock). */
export default function ProductLinesTable({ form, products, editable, available = [] }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' })
  const errors = form.formState.errors.lines
  const uom = (id) => products.find((p) => p.id === Number(id))?.uom

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-2 font-medium">Product</th>
            <th className="w-40 px-3 py-2 font-medium">Quantity</th>
            <th className="w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {fields.map((field, i) => {
            const short = available[i] === false
            return (
              <tr key={field.id} className={cx(short && 'bg-red-50')}>
                <td className="px-3 py-2">
                  <Select
                    disabled={!editable}
                    className={cx(short && 'border-red-400 text-red-700')}
                    {...form.register(`lines.${i}.product_id`)}
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name}
                      </option>
                    ))}
                  </Select>
                  {errors?.[i]?.product_id && (
                    <span className="text-xs text-red-600">{errors[i].product_id.message}</span>
                  )}
                  {short && (
                    <span className="text-xs font-medium text-red-600">Not enough stock</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!editable}
                      className={cx(short && 'border-red-400 text-red-700')}
                      {...form.register(`lines.${i}.quantity`)}
                    />
                    <span className="text-xs text-slate-500">
                      {uom(form.watch(`lines.${i}.product_id`))}
                    </span>
                  </div>
                  {errors?.[i]?.quantity && (
                    <span className="text-xs text-red-600">{errors[i].quantity.message}</span>
                  )}
                </td>
                <td className="px-2">
                  {editable && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Remove line"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {editable && (
        <div className="border-t border-slate-100 p-2">
          <Button variant="ghost" onClick={() => append({ product_id: '', quantity: 1 })}>
            <Plus className="size-4" /> Add a product
          </Button>
        </div>
      )}
      {typeof errors?.message === 'string' && (
        <p className="px-3 pb-2 text-xs text-red-600">{errors.message}</p>
      )}
    </div>
  )
}
