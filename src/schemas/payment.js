import { z } from 'zod'
import { dateSchema, paymentMethodSchema } from './common'

/**
 * Payment Schema
 * Used for payment recording, editing, and validation
 */

// Base payment schema for Firestore documents
export const paymentSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  memberName: z.string().min(1, 'Member name is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentDate: dateSchema,
  paymentMethod: paymentMethodSchema,
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

// Form schema - strings from inputs, amount needs conversion
export const paymentFormSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  memberName: z.string().optional().default(''),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0
      },
      'Amount must be greater than 0'
    ),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

// Transform form data to payment data
export const transformPaymentFormData = (formData) => {
  return {
    memberId: formData.memberId,
    memberName: formData.memberName,
    amount: parseFloat(formData.amount),
    paymentDate: formData.paymentDate,
    paymentMethod: formData.paymentMethod,
    reference: formData.reference || '',
    notes: formData.notes || '',
  }
}

// Update payment schema (for editing)
export const paymentUpdateSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  paymentDate: dateSchema,
  paymentMethod: paymentMethodSchema,
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

// Validate payment form data
export const validatePaymentForm = (data) => {
  return paymentFormSchema.safeParse(data)
}

// Validate payment data for service layer
export const validatePayment = (data) => {
  return paymentSchema.safeParse(data)
}
