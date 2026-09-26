import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { signup } from '../../api/auth'
import { errorMessage } from '../../api/client'
import { Button, Field, Input } from '../../components/common/ui'
import AuthCard from './AuthCard'
import { password, passwordsMatch, startSession } from './helpers'

const schema = z
  .object({
    login_id: z
      .string()
      .min(6, 'Login ID must be 6-12 characters')
      .max(12, 'Login ID must be 6-12 characters')
      .regex(/^\S+$/, 'No spaces'),
    email: z.email('Enter a valid email'),
    password,
    confirm: z.string(),
  })
  .refine(...passwordsMatch)

export default function Signup() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    try {
      const { access_token } = await signup(values)
      await startSession(access_token, navigate)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <AuthCard
      title="Sign Up"
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand">
            Sign In
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Login ID" error={errors.login_id}>
          <Input autoFocus autoComplete="username" {...register('login_id')} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Field label="Re-Enter Password" error={errors.confirm}>
          <Input type="password" autoComplete="new-password" {...register('confirm')} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Sign Up
        </Button>
      </form>
    </AuthCard>
  )
}
