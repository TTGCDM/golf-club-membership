import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../contexts/AuthContext'
import { registerSchema } from '../schemas'
import { FormField, FormInput } from '../components/form'

const Register = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register: registerUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      setError('')
      await registerUser(data.email, data.password)
      setSuccess(true)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak')
      } else {
        setError('Failed to create account. Please try again.')
      }
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Registration Successful!
            </h2>
          </div>
          <div className="rounded-md bg-ocean-seafoam bg-opacity-20 p-4 border border-ocean-teal">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-ocean-teal" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-ocean-teal">
                  Account created successfully
                </h3>
                <div className="mt-2 text-sm text-ocean-teal">
                  <p>
                    Your account has been created and is pending approval by an administrator.
                    You will be able to log in once your account has been approved.
                  </p>
                  <p className="mt-2">
                    You will receive a notification when your account is approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-ocean-teal hover:text-ocean-navy"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register for Tea Tree Golf Club Membership System
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <FormField
              label="Email address"
              name="email"
              error={errors.email?.message}
            >
              <FormInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                error={errors.email?.message}
                {...register('email')}
              />
            </FormField>

            <FormField
              label="Password"
              name="password"
              error={errors.password?.message}
            >
              <FormInput
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Password (min 6 characters)"
                error={errors.password?.message}
                {...register('password')}
              />
            </FormField>

            <FormField
              label="Confirm Password"
              name="confirmPassword"
              error={errors.confirmPassword?.message}
            >
              <FormInput
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </FormField>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ocean-teal hover:bg-ocean-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-teal disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Register'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-ocean-teal hover:text-ocean-navy">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
