import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../contexts/AuthContext'
import { loginSchema, passwordResetSchema } from '../schemas'
import { FormField, FormInput } from '../components/form'

const Login = () => {
  const [error, setError] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState('')
  const { login, resetPassword, currentUser } = useAuth()
  const navigate = useNavigate()

  // Login form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Password reset form
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
    reset: resetForm,
  } = useForm({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  // Navigate to dashboard once auth state is confirmed
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  const onSubmit = async (data) => {
    try {
      setError('')
      await login(data.email, data.password)
      // Navigation is handled by the useEffect once auth state updates
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password')
      } else {
        setError('Failed to sign in. Please try again.')
      }
      console.error('Login error:', err)
    }
  }

  const onResetPassword = async (data) => {
    setResetError('')
    setResetSuccess(false)

    try {
      await resetPassword(data.email)
      setResetSuccess(true)
      setTimeout(() => {
        setShowResetPassword(false)
        setResetSuccess(false)
        resetForm()
      }, 3000)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email address')
      } else {
        setResetError('Failed to send reset email. Please try again.')
      }
    }
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-teal to-ocean-navy">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-ocean-navy">Reset Password</h1>
            <p className="text-gray-600 mt-2">Enter your email to receive a password reset link</p>
          </div>

          {resetSuccess && (
            <div className="bg-ocean-seafoam bg-opacity-30 border border-ocean-teal text-ocean-navy px-4 py-3 rounded mb-4">
              Password reset email sent! Check your inbox.
            </div>
          )}

          {resetError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {resetError}
            </div>
          )}

          <form onSubmit={handleSubmitReset(onResetPassword)} className="space-y-6">
            <FormField
              label="Email Address"
              name="reset-email"
              error={resetErrors.email?.message}
            >
              <FormInput
                id="reset-email"
                type="email"
                placeholder="your.email@example.com"
                error={resetErrors.email?.message}
                {...registerReset('email')}
              />
            </FormField>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ocean-teal hover:bg-ocean-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-teal"
            >
              Send Reset Link
            </button>

            <button
              type="button"
              onClick={() => setShowResetPassword(false)}
              className="w-full text-center text-sm text-gray-600 hover:text-ocean-navy"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-teal to-ocean-navy">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ocean-navy">Tea Tree Golf Club</h1>
          <p className="text-gray-600 mt-2">Membership Management System</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label="Email Address"
            name="email"
            error={errors.email?.message}
          >
            <FormInput
              id="email"
              type="email"
              placeholder="admin@teatreegolf.com"
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
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ocean-teal hover:bg-ocean-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-teal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="text-ocean-teal hover:text-ocean-navy font-medium"
            >
              Forgot password?
            </button>
            <Link
              to="/register"
              className="text-ocean-teal hover:text-ocean-navy font-medium"
            >
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
