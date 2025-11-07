import { CourseLevel, CourseStatus } from 'src/shared/constants/course.constant'
import z from 'zod'

// Enrollment Schema
export const EnrollmentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  courseId: z.string(),
  enrolledAt: z.date(),
})

// DTOs

export const EnrollResSchema = EnrollmentSchema

export const GetEnrollmentsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    courseId: z.string().optional(), // Lọc theo course (cho instructor/admin)
    studentId: z.string().optional(), // Lọc theo student (cho admin)
  })
  .strict()

export const GetEnrollmentParamsSchema = z
  .object({
    enrollmentId: z.string(),
  })
  .strict()

export const EnrollCourseBodySchema = z
  .object({
    courseId: z.string(),
  })
  .strict()

export const GetEnrollmentsResSchema = z.object({
  data: z.array(
    EnrollmentSchema.extend({
      student: z.object({
        id: z.string(),
        fullName: z.string(),
        email: z.string(),
        avatar: z.string().nullable(),
      }),
      course: z.object({
        id: z.string(),
        title: z.string(),
        thumbnail: z.string().nullable(),
        level: z.enum([CourseLevel.Beginner, CourseLevel.Intermediate, CourseLevel.Advanced]),
        instructor: z.object({
          id: z.string(),
          fullName: z.string(),
        }),
      }),
    }),
  ),
  totalItems: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const GetEnrollmentDetailResSchema = EnrollmentSchema.extend({
  student: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
  }),
  course: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    thumbnail: z.string().nullable(),
    level: z.enum([CourseLevel.Beginner, CourseLevel.Intermediate, CourseLevel.Advanced]),
    status: z.enum([CourseStatus.Archived, CourseStatus.Draft, CourseStatus.Published]),
    instructor: z.object({
      id: z.string(),
      fullName: z.string(),
      email: z.string(),
    }),
    chapters: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        position: z.number(),
        lessons: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            position: z.number(),
            duration: z.number().nullable(),
          }),
        ),
      }),
    ),
  }),
})

export const GetMyEnrollmentsResSchema = z.object({
  data: z.array(
    EnrollmentSchema.extend({
      course: z.object({
        id: z.string(),
        title: z.string(),
        thumbnail: z.string().nullable(),
        level: z.enum([CourseLevel.Beginner, CourseLevel.Intermediate, CourseLevel.Advanced]),
        slug: z.string(),
        instructor: z.object({
          id: z.string(),
          fullName: z.string(),
          avatar: z.string().nullable(),
        }),
        _count: z
          .object({
            chapters: z.number(),
          })
          .optional(),
      }),
    }),
  ),
  totalItems: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
})

// Types
export type EnrollmentType = z.infer<typeof EnrollmentSchema>
export type GetEnrollmentsQueryType = z.infer<typeof GetEnrollmentsQuerySchema>
export type GetEnrollmentParamsType = z.infer<typeof GetEnrollmentParamsSchema>
export type EnrollCourseBodyType = z.infer<typeof EnrollCourseBodySchema>
export type GetEnrollmentsResType = z.infer<typeof GetEnrollmentsResSchema>
export type GetEnrollmentDetailResType = z.infer<typeof GetEnrollmentDetailResSchema>
export type GetMyEnrollmentsResType = z.infer<typeof GetMyEnrollmentsResSchema>
export type EnrollResType = z.infer<typeof EnrollResSchema>
