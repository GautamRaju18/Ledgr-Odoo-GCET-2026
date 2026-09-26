import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { forgotPassword, resetPassword } from '../../api/auth'
import { errorMessage } from '../../api/client'
import { Button, Field, Input } from '../../components/common/ui'
import AuthCard from './AuthCard'
import { password, passwordsMatch } from './helpers'

const emailSchema = z.object({ email: z.email('Enter a valid email') })
const resetSchema = z
  .object({
    otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
    password,
    confirm: z.string(),
  })
  .refine(...passwordsMatch)

function EmailStep({ onSent }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(emailSchema) })
  const onSubmit = async ({ email }) => {
    try {
      toast.success((await forgotPassword({ email })).detail)
      onSent(email)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Registered email" error={errors.email}>
        <Input type="email" autoFocus {...register('email')} />
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Send OTP
      </Button>
    </form>
  )
}

function ResetStep({ email }) {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetSchema) })
  const onSubmit = async ({ otp, password }) => {
    try {
      toast.success((await resetPassword({ email, otp, new_password: password })).detail)
      navigate('/login')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-slate-500">
        Enter the code sent to <b>{email}</b>. It expires in 10 minutes.
      </p>
      <Field label="OTP" error={errors.otp}>
        <Input inputMode="numeric" maxLength={6} autoFocus {...register('otp')} />
      </Field>
      <Field label="New password" error={errors.password}>
        <Input type="password" autoComplete="new-password" {...register('password')} />
      </Field>
      <Field label="Confirm password" error={errors.confirm}>
        <Input type="password" autoComplete="new-password" {...register('confirm')} />
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Reset password
      </Button>
    </form>
  )
}

export default function ForgotPassword() {
  const [email, setEmail] = useState(null)
  return (
    <AuthCard
      title="Reset password"
      footer={
        <Link to="/login" className="font-medium text-brand">
          Back to log in
        </Link>
      }
    >
      {email ? <ResetStep email={email} /> : <EmailStep onSent={setEmail} />}
    </AuthCard>
  )
}
