import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { login } from '../../api/auth'
import { errorMessage } from '../../api/client'
import { Button, Field, Input } from '../../components/common/ui'
import AuthCard from './AuthCard'
import { startSession } from './helpers'

const schema = z.object({
  login_id: z.string().min(1, 'Enter your Login ID'),
  password: z.string().min(1, 'Enter your password'),
})

export default function Login() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    try {
      const { access_token } = await login(values)
      await startSession(access_token, navigate)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <AuthCard title="Sign In">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Login ID" error={errors.login_id}>
          <Input autoFocus autoComplete="username" {...register('login_id')} />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Sign In
        </Button>
        <p className="text-center text-sm text-brand">
          <Link to="/forgot-password">Forgot Password?</Link>
          <span className="px-2 text-slate-300">|</span>
          <Link to="/signup">Sign Up</Link>
        </p>
      </form>
    </AuthCard>
  )
}
