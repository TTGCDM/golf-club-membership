import { z } from 'zod'
import {
  optionalEmailSchema,
  optionalAustralianPhoneSchema,
  optionalDateOfBirthSchema,
  dateSchema,
  memberStatusSchema,
} from './common'

/**
 * Member Schema
 * Used for member creation, editing, and validation
 */

// Base member schema for Firestore documents
export const memberSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: optionalEmailSchema.optional().default(''),
  phone: optionalAustralianPhoneSchema.optional().default(''),
  address: z.string().optional().default(''),
  dateOfBirth: optionalDateOfBirthSchema.optional().default(''),
  emergencyContact: z.string().optional().default(''),
  golfAustraliaId: z.string().optional().default(''), // Optional for social members
  dateJoined: dateSchema,
  membershipCategory: z.string().min(1, 'Membership category is required'),
  status: memberStatusSchema.default('active'),
  accountBalance: z.number().default(0),
})

// Form schema - what the form submits (all strings from inputs)
export const memberFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  dateOfBirth: z.string().optional().default(''),
  emergencyContact: z.string().optional().default(''),
  golfAustraliaId: z.string().optional().default(''), // Optional for social members
  dateJoined: z.string().min(1, 'Date joined is required'),
  membershipCategory: z.string().min(1, 'Membership category is required'),
  status: z.string().default('active'),
})

// CSV row schema for imports
export const memberCSVRowSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  golfAustraliaId: z.string().min(1, 'Golf Australia ID is required'),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Date of birth must be in YYYY-MM-DD format'
    ),
  emergencyContact: z.string().optional().default(''),
  dateJoined: z.string().optional().default(''),
  membershipCategory: z.string().optional().default(''),
  status: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || ['active', 'inactive'].includes(val.toLowerCase()),
      'Status must be "active" or "inactive"'
    ),
  accountBalance: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(parseFloat(val)),
      'Account balance must be a valid number'
    ),
})

// Transform CSV row to member data
export const transformCSVRowToMember = (row) => {
  return {
    fullName: row.fullName?.trim() || '',
    golfAustraliaId: row.golfAustraliaId?.trim() || '',
    email: row.email?.trim() || '',
    phone: row.phone?.trim() || '',
    address: row.address?.trim() || '',
    dateOfBirth: row.dateOfBirth?.trim() || '',
    emergencyContact: row.emergencyContact?.trim() || '',
    dateJoined: row.dateJoined?.trim() || new Date().toISOString().split('T')[0],
    membershipCategory: row.membershipCategory?.trim() || '',
    status: row.status?.toLowerCase().trim() || 'active',
    accountBalance: row.accountBalance ? parseFloat(row.accountBalance) : 0,
  }
}

// Validate and parse member form data
export const validateMemberForm = (data) => {
  return memberFormSchema.safeParse(data)
}

// Validate member data for service layer
export const validateMember = (data) => {
  return memberSchema.safeParse(data)
}

// Validate CSV row
export const validateCSVRow = (row) => {
  return memberCSVRowSchema.safeParse(row)
}
