import z from 'zod'
import { HTTPMethod } from '../constants/role.constants'

export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(255),
  path: z.string().max(1000),
  method: z.enum([
    HTTPMethod.GET,
    HTTPMethod.POST,
    HTTPMethod.PUT,
    HTTPMethod.DELETE,
    HTTPMethod.PATCH,
    HTTPMethod.OPTIONS,
    HTTPMethod.HEAD,
  ]),

  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  deletedById: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})
