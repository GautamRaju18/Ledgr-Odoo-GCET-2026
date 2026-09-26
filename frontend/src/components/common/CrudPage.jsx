import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '../../api/client'
import { Button, Card, Field, Input, PageHeader, Select, Table } from './ui'

/**
 * List + create/edit/delete page for simple master data.
 * fields: [{name, label, options?: [{value, label}]}] (options => select)
 * rowFilter: optional predicate to hide rows (e.g. system records)
 */
export default function CrudPage({
  title,
  api,
  queryKey,
  columns,
  fields,
  schema,
  defaults,
  rowFilter = () => true,
}) {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: () => api.list() })
  const [editing, setEditing] = useState(null) // null | 'new' | row
  const form = useForm({ resolver: zodResolver(schema) })
  const { errors, isSubmitting } = form.formState

  const open = (row) => {
    setEditing(row ?? 'new')
    form.reset(row ?? defaults)
  }
  const onSubmit = async (values) => {
    try {
      if (editing === 'new') await api.create(values)
      else await api.update(editing.id, values)
      toast.success('Saved')
      setEditing(null)
      qc.invalidateQueries()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  const remove = async (row) => {
    if (!window.confirm(`Delete ${row.name}?`)) return
    try {
      await api.remove(row.id)
      toast.success('Deleted')
      qc.invalidateQueries()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const actions = {
    key: 'actions',
    label: '',
    className: 'w-20 text-right',
    render: (row) => (
      <span className="flex justify-end gap-2 text-slate-400">
        <button onClick={() => open(row)} className="hover:text-brand" aria-label="Edit">
          <Pencil className="size-4" />
        </button>
        <button onClick={() => remove(row)} className="hover:text-red-600" aria-label="Delete">
          <Trash2 className="size-4" />
        </button>
      </span>
    ),
  }

  return (
    <>
      <PageHeader title={title}>
        <Button onClick={() => open()}>
          <Plus className="size-4" /> New
        </Button>
      </PageHeader>
      {editing && (
        <Card className="mb-4">
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid items-end gap-3 sm:grid-cols-4"
          >
            {fields.map((f) => (
              <Field key={f.name} label={f.label} error={errors[f.name]}>
                {f.options ? (
                  <Select {...form.register(f.name)}>
                    <option value="">—</option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input {...form.register(f.name)} />
                )}
              </Field>
            ))}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                Save
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Discard
              </Button>
            </div>
          </form>
        </Card>
      )}
      <Table columns={[...columns, actions]} rows={data.filter(rowFilter)} loading={isLoading} />
    </>
  )
}
