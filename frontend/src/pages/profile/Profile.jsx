import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorMessage } from '../../api/client'
import { me } from '../../api/resources'
import { Button, Card, Field, Input, Loading, PageHeader } from '../../components/common/ui'

const schema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  email: z.email('Enter a valid email'),
})

function ProfileForm({ user }) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm({ resolver: zodResolver(schema), defaultValues: user })
  const onSubmit = async (values) => {
    try {
      const saved = await me.update(values)
      qc.setQueryData(['me'], saved)
      reset(saved)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  return (
    <Card className="max-w-lg">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Login ID">
          <Input value={user.login_id} disabled readOnly />
        </Field>
        <Field label="Name" error={errors.name}>
          <Input {...register('name')} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" {...register('email')} />
        </Field>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          Save
        </Button>
      </form>
    </Card>
  )
}

export default function Profile() {
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: me.get })
  return (
    <>
      <PageHeader title="My Profile" />
      {isLoading ? <Loading /> : <ProfileForm user={user} />}
    </>
  )
}
