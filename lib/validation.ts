import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  display_name: z.string().min(1, 'Display name is required').max(50),
  bio: z.string().max(160, 'Bio must be at most 160 characters').optional(),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

export const habitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color hex'),
  frequency: z.enum(['daily', 'custom']),
  customDays: z.array(z.number().min(0).max(6)).optional(),
  type: z.enum(['activity', 'output']).default('activity'),
})

export type SignUpSchema = z.infer<typeof signUpSchema>
export type SignInSchema = z.infer<typeof signInSchema>
export type ProfileSchema = z.infer<typeof profileSchema>
export type HabitSchema = z.infer<typeof habitSchema>
