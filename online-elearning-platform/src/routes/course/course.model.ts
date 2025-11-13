import { CourseLevel, CourseStatus } from 'src/shared/constants/course.constant'
import z from 'zod'

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  thumbnail: z.url().nullable(),
  duration: z.number().int().positive().nullable(),
  level: z.enum([CourseLevel.Beginner, CourseLevel.Intermediate, CourseLevel.Advanced]),
  status: z.enum([CourseStatus.Archived, CourseStatus.Draft, CourseStatus.Published]),
  slug: z.string().min(1).max(300),
  category: z.string().nullable(),
  smallDescription: z.string().max(500).nullable(),
  requirements: z.array(z.string()),
  whatYouWillLearn: z.array(z.string()),
  instructorId: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  deletedById: z.string().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const GetCoursesQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    level: z.enum([CourseLevel.Beginner, CourseLevel.Intermediate, CourseLevel.Advanced]).optional(),
    status: z.enum([CourseStatus.Archived, CourseStatus.Draft, CourseStatus.Published]).optional(),
    search: z.string().optional(),
  })
  .strict()

export const GetCourseParamsSchema = z
  .object({
    courseId: z.string(),
  })
  .strict()

export const GetCourseBySlugParamsSchema = z
  .object({
    slug: z.string(),
  })
  .strict()

export const CreateCourseBodySchema = CourseSchema.pick({
  title: true,
  description: true,
  thumbnail: true,
  duration: true,
  level: true,
  category: true,
  smallDescription: true,
  status: true,
  requirements: true,
  whatYouWillLearn: true,
})
  .extend({
    slug: z.string().optional(),
    instructorId: z.string().optional(), // Admin có thể chỉ định instructor
  })
  .strict()

export const UpdateCourseBodySchema = CreateCourseBodySchema.partial()
  .extend({
    status: z.enum([CourseStatus.Archived, CourseStatus.Draft, CourseStatus.Published]).optional(),
  })
  .strict()

export const GetCoursesResSchema = z.object({
  data: z.array(
    CourseSchema.extend({
      instructor: z
        .object({
          id: z.string(),
          fullName: z.string(),
          email: z.string(),
          avatar: z.string().nullable(),
        })
        .optional(),
      _count: z
        .object({
          enrollments: z.number(),
          chapters: z.number(),
        })
        .optional(),
    }),
  ),
  totalItems: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const GetCourseDetailResSchema = CourseSchema.extend({
  instructor: z
    .object({
      id: z.string(),
      fullName: z.string(),
      email: z.string(),
      avatar: z.string().nullable(),
    })
    .optional()
    .nullable(),
  chapters: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        position: z.number(),
        lessons: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            position: z.number(),
            videoUrl: z.string().nullable(),
            documentUrl: z.string().nullable(),
          }),
        ),
      }),
    )
    .optional()
    .nullable(),
  _count: z
    .object({
      enrollments: z.number(),
    })
    .optional(),
})

export const CreateCourseResSchema = CourseSchema
export const UpdateCourseResSchema = CreateCourseResSchema

// Types
export type CourseType = z.infer<typeof CourseSchema>
export type CreateCourseResType = z.infer<typeof CreateCourseResSchema>
export type UpdateCourseResType = z.infer<typeof UpdateCourseResSchema>
export type GetCoursesQueryType = z.infer<typeof GetCoursesQuerySchema>
export type GetCourseParamsType = z.infer<typeof GetCourseParamsSchema>
export type GetCourseBySlugParamsType = z.infer<typeof GetCourseBySlugParamsSchema>
export type CreateCourseBodyType = z.infer<typeof CreateCourseBodySchema>
export type UpdateCourseBodyType = z.infer<typeof UpdateCourseBodySchema>
export type GetCoursesResType = z.infer<typeof GetCoursesResSchema>
export type GetCourseDetailResType = z.infer<typeof GetCourseDetailResSchema>
