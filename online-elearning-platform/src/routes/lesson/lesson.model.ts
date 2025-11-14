import z from 'zod'
import { CourseSchema } from '../course/course.model'
import { ChapterSchema } from '../chapter/chapter.model'

// Lesson Schema
export const LessonSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  position: z.number().int().positive(),
  videoUrl: z.url().nullable(),
  documentUrl: z.url().nullable(),
  transcript: z.string().nullable(),
  duration: z.number().int().positive().nullable(),
  content: z.string().nullable().optional(),
  chapterId: z.string(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// DTOs
export const GetLessonsQuerySchema = z
  .object({
    chapterId: z.string(),
  })
  .strict()

export const GetLessonParamsSchema = z
  .object({
    lessonId: z.string(),
  })
  .strict()

export const CreateLessonBodySchema = z
  .object({
    title: z.string().min(1).max(200),
    chapterId: z.string(),
    videoUrl: z.url().nullable().optional(),
    documentUrl: z.url().nullable().optional(),
    transcript: z.string().nullable().optional(),
    duration: z.number().int().positive().nullable().optional(),
    content: z.string().nullable().optional(),
    position: z.number().int().positive().optional(),
  })
  .strict()

export const UpdateLessonBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    videoUrl: z.url().nullable().optional(),
    documentUrl: z.url().nullable().optional(),
    transcript: z.string().nullable().optional(),
    duration: z.number().int().positive().nullable().optional(),
    content: z.string().nullable().optional(),
    position: z.number().int().positive().optional(),
  })
  .strict()

export const ReorderLessonsBodySchema = z
  .object({
    chapterId: z.string(),
    lessons: z.array(
      z.object({
        id: z.string(),
        position: z.number().int().positive(),
      }),
    ),
  })
  .strict()

export const GetLessonsResSchema = z.object({
  data: z.array(LessonSchema),
})

export const GetLessonDetailResSchema = LessonSchema.extend({
  chapter: ChapterSchema.pick({
    id: true,
    title: true,
    courseId: true,
  }).extend({
    course: CourseSchema.pick({
      id: true,
      title: true,
      instructorId: true,
    }),
  }),
})

export const CreateLessonResSchema = LessonSchema
export const UpdateLessonResSchema = CreateLessonResSchema.partial().strict()

// Types
export type LessonType = z.infer<typeof LessonSchema>
export type GetLessonsQueryType = z.infer<typeof GetLessonsQuerySchema>
export type GetLessonParamsType = z.infer<typeof GetLessonParamsSchema>
export type CreateLessonBodyType = z.infer<typeof CreateLessonBodySchema>
export type CreateLessonBodyResType = z.infer<typeof CreateLessonResSchema>
export type UpdateLessonBodyType = z.infer<typeof UpdateLessonBodySchema>
export type UpdateLessonBodyResType = z.infer<typeof UpdateLessonResSchema>
export type ReorderLessonsBodyType = z.infer<typeof ReorderLessonsBodySchema>
export type GetLessonsResType = z.infer<typeof GetLessonsResSchema>
export type GetLessonDetailResType = z.infer<typeof GetLessonDetailResSchema>
