import { cx } from '../common/format'
import { Badge } from '../common/ui'
import { FLOW, STATUS } from '../../pages/operations/kinds'

export default function StatusBar({ type, status }) {
  if (status === 'canceled') return <Badge tone="red">Canceled</Badge>
  const steps = FLOW[type]
  const current = steps.indexOf(status)
  return (
    <ol className="flex text-xs font-medium">
      {steps.map((step, i) => (
        <li
          key={step}
          className={cx(
            'border border-slate-300 px-3 py-1.5 first:rounded-l-md last:rounded-r-md [&:not(:first-child)]:-ml-px',
            i === current
              ? 'z-10 border-brand bg-brand text-white'
              : i < current
                ? 'bg-slate-100 text-slate-600'
                : 'bg-white text-slate-400',
          )}
        >
          {STATUS[step].label}
        </li>
      ))}
    </ol>
  )
}
