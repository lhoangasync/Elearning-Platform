import z from 'zod'
import { UserStatus } from '../constants/auth.constant'

export const UserSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(6).max(100),
  phoneNumber: z.string().max(11).nullable(),
  avatar: z.string().nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE]),
  totpSecret: z.string().nullable(),
  roleId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})

export type UserType = z.infer<typeof UserSchema>
