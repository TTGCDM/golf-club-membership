import { z } from 'zod'
import {
  emailSchema,
  australianPhoneSchema,
  optionalAustralianPhoneSchema,
  postcodeSchema,
  australianStateSchema,
  dateOfBirthSchema,
  golfLinkSchema,
  handicapSchema,
  titleSchema,
  applicationStatusSchema,
} from './common'

/**
 * Application Schema
 * Used for public membership applications
 */

// Public application form schema (most comprehensive)
export const applicationFormSchema = z
  .object({
    // Personal Information
    title: titleSchema,
    fullName: z.string().min(1, 'Full name is required'),

    // Residential Address
    streetAddress: z.string().min(1, 'Street address is required'),
    suburb: z.string().min(1, 'Suburb is required'),
    state: australianStateSchema,
    postcode: postcodeSchema,

    // Contact Information
    email: emailSchema,
    phoneMobile: optionalAustralianPhoneSchema.optional().default(''),
    phoneHome: optionalAustralianPhoneSchema.optional().default(''),
    phoneWork: optionalAustralianPhoneSchema.optional().default(''),

    // Personal Details
    dateOfBirth: dateOfBirthSchema,

    // Golf Background
    previousClubs: z.string().optional().default(''),
    golfLinkNumber: golfLinkSchema.optional().default(''),
    lastHandicap: handicapSchema.optional().default(''),

    // Membership Category
    membershipCategoryId: z.string().min(1, 'Please select a membership category'),

    // Agreement
    agreedToTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
    }),
  })

// Admin application form schema (simplified, no email confirm)
export const adminApplicationFormSchema = z.object({
  // Personal Information
  title: z.string().min(1, 'Title is required'),
  fullName: z.string().min(1, 'Full name is required'),

  // Address
  streetAddress: z.string().min(1, 'Street address is required'),
  suburb: z.string().min(1, 'Suburb is required'),
  state: australianStateSchema,
  postcode: postcodeSchema,

  // Contact
  email: emailSchema,
  phoneHome: z.string().optional().default(''),
  phoneWork: z.string().optional().default(''),
  phoneMobile: australianPhoneSchema,

  // Personal Details
  dateOfBirth: dateOfBirthSchema,

  // Golf Background
  golfLinkNumber: golfLinkSchema.optional().default(''),
  lastHandicap: handicapSchema.optional().default(''),
  previousClubs: z.string().optional().default(''),

  // Membership Category
  membershipCategoryId: z.string().min(1, 'Membership category is required'),
})

// Base application schema for Firestore documents
export const applicationSchema = z.object({
  // Personal Details
  title: z.string().optional(),
  fullName: z.string().min(1),

  // Address
  streetAddress: z.string().min(1),
  suburb: z.string().min(1),
  state: z.string().min(1),
  postcode: z.string().min(1),

  // Contact
  email: z.string().email(),
  phoneHome: z.string().optional(),
  phoneWork: z.string().optional(),
  phoneMobile: z.string().min(1),

  // Personal Info
  dateOfBirth: z.string().min(1),

  // Golf
  previousClubs: z.string().optional(),
  golfLinkNumber: z.string().optional(),
  lastHandicap: z.string().optional(),

  // Membership
  membershipCategoryId: z.string().min(1),
  membershipCategoryName: z.string().optional(),

  // Status
  status: applicationStatusSchema,
  emailVerified: z.boolean(),
})

// Rejection schema
export const rejectionSchema = z.object({
  rejectionReason: z
    .string()
    .min(1, 'Rejection reason is required')
    .refine(
      (val) => val.trim().length > 0,
      'Rejection reason cannot be empty'
    ),
})

// Transform public form data for submission
export const transformApplicationFormData = (formData, costEstimate = null) => {
  const result = {
    title: formData.title || '',
    fullName: formData.fullName.trim(),
    streetAddress: formData.streetAddress.trim(),
    suburb: formData.suburb.trim(),
    state: formData.state,
    postcode: formData.postcode.trim(),
    email: formData.email.trim().toLowerCase(),
    phoneHome: formData.phoneHome?.trim() || '',
    phoneWork: formData.phoneWork?.trim() || '',
    phoneMobile: formData.phoneMobile?.trim() || '',
    dateOfBirth: formData.dateOfBirth,
    previousClubs: formData.previousClubs?.trim() || '',
    golfLinkNumber: formData.golfLinkNumber?.trim() || '',
    lastHandicap: formData.lastHandicap?.trim() || '',
    membershipCategoryId: formData.membershipCategoryId,
    membershipCategoryName: formData.membershipCategoryName || '',
  }

  // Include cost estimate if provided
  if (costEstimate) {
    result.estimatedProRataFee = costEstimate.proRataSubscription
    result.estimatedJoiningFee = costEstimate.joiningFee
    result.estimatedTotalCost = costEstimate.total
    result.estimatedCostCalculatedAt = new Date().toISOString()
  }

  return result
}

// Validate public application form
export const validateApplicationForm = (data) => {
  return applicationFormSchema.safeParse(data)
}

// Validate admin application form
export const validateAdminApplicationForm = (data) => {
  return adminApplicationFormSchema.safeParse(data)
}

// Validate rejection
export const validateRejection = (data) => {
  return rejectionSchema.safeParse(data)
}
