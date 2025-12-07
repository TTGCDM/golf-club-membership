import { z } from 'zod'

/**
 * Fee Schema
 * Used for annual fee application
 */

// Base fee schema for Firestore documents
export const feeSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  memberName: z.string().min(1, 'Member name is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  categoryName: z.string().min(1, 'Category name is required'),
  feeYear: z.number().int().min(2020).max(2100),
  amount: z.number().min(0, 'Amount cannot be negative'),
  appliedDate: z.string().min(1, 'Applied date is required'),
  appliedBy: z.string().min(1, 'Applied by is required'),
  notes: z.string().optional().default(''),
})

// Fee application form schema
export const feeApplicationFormSchema = z.object({
  feeYear: z
    .string()
    .min(1, 'Fee year is required')
    .refine(
      (val) => {
        const year = parseInt(val)
        return !isNaN(year) && year >= 2020 && year <= 2100
      },
      'Please select a valid year'
    ),
  // Category overrides are optional - keyed by category ID
  categoryOverrides: z.record(z.string(), z.string()).optional().default({}),
})

// Transform fee application form data
export const transformFeeApplicationFormData = (formData) => {
  const overrides = {}
  if (formData.categoryOverrides) {
    Object.entries(formData.categoryOverrides).forEach(([categoryId, amount]) => {
      if (amount && amount.trim() !== '') {
        const parsed = parseFloat(amount)
        if (!isNaN(parsed) && parsed >= 0) {
          overrides[categoryId] = parsed
        }
      }
    })
  }
  return {
    feeYear: parseInt(formData.feeYear),
    categoryOverrides: overrides,
  }
}

// Validate fee application form
export const validateFeeApplicationForm = (data) => {
  return feeApplicationFormSchema.safeParse(data)
}

// Validate fee data for service layer
export const validateFee = (data) => {
  return feeSchema.safeParse(data)
}
