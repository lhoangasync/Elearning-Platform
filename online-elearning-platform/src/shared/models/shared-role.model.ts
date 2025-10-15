import z from 'zod'

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string().max(500),
  description: z.string(),
  isActive: z.boolean().default(true),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  deletedById: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})
