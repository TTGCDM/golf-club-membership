import { z } from 'zod'
import { emailSchema, userRoleSchema, userStatusSchema } from './common'

/**
 * User Schema
 * Used for authentication and user management
 */

// Base user schema for Firestore documents
export const userSchema = z.object({
  email: emailSchema,
  role: userRoleSchema,
  status: userStatusSchema,
})

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Registration form schema
export const registerSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailSchema,
})

// User update schema (for admin updates)
export const userUpdateSchema = z.object({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
})

// Validate login form
export const validateLogin = (data) => {
  return loginSchema.safeParse(data)
}

// Validate registration form
export const validateRegister = (data) => {
  return registerSchema.safeParse(data)
}

// Validate user data for service layer
export const validateUser = (data) => {
  return userSchema.safeParse(data)
}
