import { toast } from 'sonner'
import { z } from 'zod'
import { auth } from '../../api/client'
import { dashboard } from '../../api/resources'

// Mirrors the backend rule in app/schemas/user.py.
export const password = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'At most 72 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Add a special character')

export const passwordsMatch = [
  (v) => v.password === v.confirm,
  { message: 'Passwords do not match', path: ['confirm'] },
]

/** Save the token, go to the dashboard and warn about low / out of stock products. */
export async function startSession(token, navigate) {
  auth.save(token)
  navigate('/dashboard')
  const kpis = await dashboard.kpis().catch(() => null)
  const alerts = (kpis?.low_stock ?? 0) + (kpis?.out_of_stock ?? 0)
  if (alerts)
    toast.warning(`${kpis.low_stock} low stock and ${kpis.out_of_stock} out of stock products`)
}
