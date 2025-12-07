import { z } from 'zod'

/**
 * Category Schema
 * Used for membership category management
 */

// Base category schema for Firestore documents
export const categorySchema = z
  .object({
    name: z.string().min(1, 'Category name is required'),
    ageMin: z.number().int().min(0, 'Minimum age must be 0 or greater'),
    ageMax: z.number().int().min(0, 'Maximum age must be 0 or greater'),
    playingRights: z.string().min(1, 'Playing rights is required'),
    annualFee: z.number().min(0, 'Annual fee cannot be negative'),
    joiningFee: z.number().min(0, 'Joining fee cannot be negative'),
    isSpecial: z.boolean().default(false),
    joiningFeeMonths: z
      .array(z.number().int().min(1).max(12))
      .optional()
      .default([]),
    order: z.number().int().optional().default(999),
  })
  .refine((data) => data.ageMax >= data.ageMin, {
    message: 'Maximum age must be greater than or equal to minimum age',
    path: ['ageMax'],
  })

// Form schema - all values come as strings from inputs
export const categoryFormSchema = z
  .object({
    name: z.string().min(1, 'Category name is required'),
    ageMin: z
      .string()
      .min(1, 'Minimum age is required')
      .refine(
        (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
        'Minimum age must be a non-negative number'
      ),
    ageMax: z
      .string()
      .min(1, 'Maximum age is required')
      .refine(
        (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
        'Maximum age must be a non-negative number'
      ),
    playingRights: z.string().min(1, 'Playing rights is required'),
    annualFee: z
      .string()
      .min(1, 'Annual fee is required')
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
        'Annual fee must be a non-negative number'
      ),
    joiningFee: z
      .string()
      .min(1, 'Joining fee is required')
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
        'Joining fee must be a non-negative number'
      ),
    isSpecial: z.boolean().default(false),
    joiningFeeMonths: z.array(z.number()).optional().default([]),
  })
  .refine(
    (data) => {
      const min = parseInt(data.ageMin)
      const max = parseInt(data.ageMax)
      return max >= min
    },
    {
      message: 'Maximum age must be greater than or equal to minimum age',
      path: ['ageMax'],
    }
  )

// Transform form data to category data
export const transformCategoryFormData = (formData) => {
  return {
    name: formData.name.trim(),
    ageMin: parseInt(formData.ageMin),
    ageMax: parseInt(formData.ageMax),
    playingRights: formData.playingRights.trim(),
    annualFee: parseFloat(formData.annualFee),
    joiningFee: parseFloat(formData.joiningFee),
    isSpecial: formData.isSpecial || false,
    joiningFeeMonths: formData.joiningFeeMonths || [],
  }
}

// Validate category form data
export const validateCategoryForm = (data) => {
  return categoryFormSchema.safeParse(data)
}

// Validate category data for service layer
export const validateCategory = (data) => {
  return categorySchema.safeParse(data)
}
