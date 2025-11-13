import z from 'zod'
import { CourseSchema } from '../course/course.model'

// Quiz Schema
export const QuizSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  courseId: z.string(),
  chapterId: z.string().nullable(),
  timeLimitMinutes: z.number().int().min(1).max(300).nullable(), // Giới hạn thời gian làm bài (phút)
  passingScore: z.number().int().min(0).max(100).default(60), // Điểm đậu
  maxAttempts: z.number().int().min(1).max(10).nullable(), // Số lần làm tối đa (null = unlimited)
  availableFrom: z.date().nullable(), // Thời gian bắt đầu có thể làm
  availableTo: z.date().nullable(), // Thời gian kết thúc
  shuffleQuestions: z.boolean().default(false), // Có shuffle câu hỏi không
  shuffleOptions: z.boolean().default(false), // Có shuffle đáp án không
  showCorrectAnswers: z.boolean().default(true), // Hiện đáp án đúng sau khi submit
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Question Schema
export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correctAnswerIndex: z.number().int().min(0),
  quizId: z.string(),
})

export const QuizzIncludeQuestionsSchema = QuizSchema.extend({
  questions: z.array(QuestionSchema),
})

// Student Quiz Attempt Schema
export const StudentQuizAttemptSchema = z.object({
  id: z.string(),
  score: z.number().int().min(0).max(100),
  studentId: z.string(),
  quizId: z.string(),
  startedAt: z.date(), // Thời gian bắt đầu làm
  submittedAt: z.date(), // Thời gian submit
  timeSpentSeconds: z.number().int().min(0), // Thời gian làm bài (giây)
  isPassed: z.boolean(), // Đã đậu chưa
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswerIndex: z.number().int().min(0),
      isCorrect: z.boolean(),
    }),
  ), // Lưu câu trả lời để có thể review
})

// DTOs
export const GetQuizzesQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    search: z.string().optional(), // Tìm kiếm theo title
  })
  .strict()

export const GetQuizzesForAdminQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    courseId: z.string().optional(),
    instructorId: z.string().optional(), // Admin có thể filter theo instructor
    search: z.string().optional(),
  })
  .strict()

export const GetQuizParamsSchema = z
  .object({
    quizId: z.string(),
  })
  .strict()

export const CreateQuizBodySchema = z
  .object({
    title: z.string().min(1).max(200),
    courseId: z.string(),
    chapterId: z.string().nullable().optional(),
    timeLimitMinutes: z.number().int().min(1).max(300).nullable().optional(),
    passingScore: z.number().int().min(0).max(100).default(60),
    maxAttempts: z.number().int().min(1).max(10).nullable().optional(),
    availableFrom: z.coerce.date().nullable().optional(),
    availableTo: z.coerce.date().nullable().optional(),
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    showCorrectAnswers: z.boolean().default(true),
    questions: z
      .array(
        z.object({
          text: z.string().min(1),
          options: z.array(z.string()).min(2).max(6),
          correctAnswerIndex: z.number().int().min(0),
        }),
      )
      .min(1),
  })
  .strict()

export const CreateQuizzResSchema = QuizSchema

export const UpdateQuizBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    timeLimitMinutes: z.number().int().min(1).max(300).nullable().optional(),
    passingScore: z.number().int().min(0).max(100).optional(),
    maxAttempts: z.number().int().min(1).max(10).nullable().optional(),
    availableFrom: z.coerce.date().nullable().optional(),
    availableTo: z.coerce.date().nullable().optional(),
    shuffleQuestions: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    showCorrectAnswers: z.boolean().optional(),
    questions: z
      .array(
        z.object({
          id: z.string().optional(),
          text: z.string().min(1),
          options: z.array(z.string()).min(2).max(6),
          correctAnswerIndex: z.number().int().min(0),
        }),
      )
      .optional(),
  })
  .strict()

export const UpdateQuizzResSchema = QuizSchema.extend({
  questions: z.array(QuestionSchema),
})

export const SubmitQuizBodySchema = z
  .object({
    quizId: z.string(),
    attemptId: z.string(), // ID của attempt được tạo khi start quiz
    answers: z.array(
      z.object({
        questionId: z.string(),
        selectedAnswerIndex: z.number().int().min(0),
      }),
    ),
  })
  .strict()

export const StartQuizBodySchema = z
  .object({
    quizId: z.string(),
  })
  .strict()

export const GetQuizzesResSchema = z.object({
  data: z.array(
    QuizSchema.extend({
      _count: z
        .object({
          questions: z.number(),
          attempts: z.number(),
        })
        .optional(),
      course: CourseSchema.pick({ id: true, title: true }).extend({
        chapters: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
          }),
        ),
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

export const GetQuizDetailResSchema = QuizSchema.extend({
  course: z.object({
    id: z.string(),
    title: z.string(),
    instructorId: z.string(),
  }),
  chapter: z
    .object({
      id: z.string(),
      title: z.string(),
    })
    .nullable(),
  questions: z.array(QuestionSchema),
})

// Response khi student làm quiz (không show đáp án đúng)
export const GetQuizForStudentResSchema = QuizSchema.extend({
  course: z.object({
    id: z.string(),
    title: z.string(),
  }),
  chapter: z
    .object({
      id: z.string(),
      title: z.string(),
    })
    .nullable(),
  questions: z.array(QuestionSchema.omit({ correctAnswerIndex: true })),
  remainingAttempts: z.number().nullable(), // Số lần còn lại (null = unlimited)
  myAttempts: z.number(), // Số lần đã làm
  canTakeQuiz: z.boolean(), // Có thể làm không (dựa vào time + attempts)
  reason: z.string().nullable(), // Lý do không thể làm
})

export const StartQuizResSchema = z.object({
  attemptId: z.string(),
  quiz: GetQuizForStudentResSchema,
  startedAt: z.date(),
  expiresAt: z.date().nullable(), // Thời gian hết hạn (nếu có time limit)
  timeLimitSeconds: z.number().nullable(),
})

export const SubmitQuizResSchema = z.object({
  attemptId: z.string(),
  score: z.number(),
  isPassed: z.boolean(),
  passingScore: z.number(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  timeSpentSeconds: z.number(),
  showCorrectAnswers: z.boolean(), // Có hiện đáp án đúng không
  results: z.array(
    z.object({
      questionId: z.string(),
      questionText: z.string(),
      selectedAnswerIndex: z.number(),
      correctAnswerIndex: z.number().optional(), // Chỉ có nếu showCorrectAnswers = true
      isCorrect: z.boolean(),
    }),
  ),
})

export const GetAttemptDetailResSchema = StudentQuizAttemptSchema.extend({
  quiz: z.object({
    id: z.string(),
    title: z.string(),
    showCorrectAnswers: z.boolean(),
    passingScore: z.number(),
    questions: z.array(QuestionSchema),
  }),
})

export const GetQuizAttemptsResSchema = z.object({
  data: z.array(
    StudentQuizAttemptSchema.extend({
      quiz: z.object({
        id: z.string(),
        title: z.string(),
        course: z.object({
          id: z.string(),
          title: z.string(),
        }),
      }),
      student: z.object({
        id: z.string(),
        fullName: z.string(),
        email: z.string(),
      }),
    }),
  ),
  totalItems: z.number(),
  totalPages: z.number(),
  page: z.number(),
  limit: z.number(),
})

// Types
export type QuizType = z.infer<typeof QuizSchema>
export type GetQuizzesForAdminQueryType = z.infer<typeof GetQuizzesForAdminQuerySchema>
export type CreateQuizzResType = z.infer<typeof CreateQuizzResSchema>
export type UpdateQuizzResType = z.infer<typeof UpdateQuizzResSchema>
export type QuizzIncludeQuestionsType = z.infer<typeof QuizzIncludeQuestionsSchema>
export type QuestionType = z.infer<typeof QuestionSchema>
export type StudentQuizAttemptType = z.infer<typeof StudentQuizAttemptSchema>
export type GetQuizzesQueryType = z.infer<typeof GetQuizzesQuerySchema>
export type GetQuizParamsType = z.infer<typeof GetQuizParamsSchema>
export type CreateQuizBodyType = z.infer<typeof CreateQuizBodySchema>
export type UpdateQuizBodyType = z.infer<typeof UpdateQuizBodySchema>
export type SubmitQuizBodyType = z.infer<typeof SubmitQuizBodySchema>
export type StartQuizBodyType = z.infer<typeof StartQuizBodySchema>
export type GetQuizzesResType = z.infer<typeof GetQuizzesResSchema>
export type GetQuizDetailResType = z.infer<typeof GetQuizDetailResSchema>
export type GetQuizForStudentResType = z.infer<typeof GetQuizForStudentResSchema>
export type StartQuizResType = z.infer<typeof StartQuizResSchema>
export type SubmitQuizResType = z.infer<typeof SubmitQuizResSchema>
export type GetQuizAttemptsResType = z.infer<typeof GetQuizAttemptsResSchema>
export type GetAttemptDetailResType = z.infer<typeof GetAttemptDetailResSchema>
