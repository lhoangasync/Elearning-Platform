import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateQuizBodyType,
  GetAttemptDetailResType,
  GetQuizAttemptsResType,
  GetQuizDetailResType,
  GetQuizForStudentResType,
  GetQuizzesForAdminQueryType,
  GetQuizzesQueryType,
  GetQuizzesResType,
  QuestionType,
  QuizType,
  StudentQuizAttemptType,
  UpdateQuizBodyType,
} from './quizz.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class QuizRepository {
  constructor(private prismaService: PrismaService) {}

  async list(query: GetQuizzesQueryType): Promise<GetQuizzesResType> {
    const { page, limit, courseId, chapterId, search } = query
    const skip = ((page - 1) * limit) as number
    const take = limit

    const where: Prisma.QuizWhereInput = {
      deletedAt: null,
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (chapterId) {
      where.chapterId = chapterId
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.quiz.count({ where }),
      this.prismaService.quiz.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              chapters: true,
              instructor: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    }
  }

  async listForAdmin(query: GetQuizzesForAdminQueryType): Promise<GetQuizzesResType> {
    const { page, limit, courseId, instructorId, search } = query
    const skip = ((page - 1) * limit) as number
    const take = limit

    console.log('>>>> page ', page, ' limit ', limit)

    const where: Prisma.QuizWhereInput = {
      deletedAt: null,
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (instructorId) {
      where.course = {
        instructorId,
      }
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.quiz.count({ where }),
      this.prismaService.quiz.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              chapters: true,
              instructor: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    }
  }

  async listForInstructor(query: GetQuizzesQueryType, instructorId: string): Promise<GetQuizzesResType> {
    const { page, limit, courseId, chapterId, search } = query
    const skip = (page - 1) * limit
    const take = limit

    const where: Prisma.QuizWhereInput = {
      deletedAt: null,
      course: {
        instructorId, // Chỉ lấy quiz của instructor này
      },
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (chapterId) {
      where.chapterId = chapterId
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.quiz.count({ where }),
      this.prismaService.quiz.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              chapters: true,
              instructor: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return {
      data,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    }
  }

  async findById(id: string): Promise<GetQuizDetailResType | null> {
    return this.prismaService.quiz.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
        questions: true,
      },
    })
  }

  async findByIdForStudent(id: string, studentId: string): Promise<any> {
    const quiz = await this.prismaService.quiz.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            quizId: true,
          },
        },
      },
    })

    if (!quiz) return null

    // Đếm số lần đã làm
    const myAttempts = await this.prismaService.studentQuizAttempt.count({
      where: {
        quizId: id,
        studentId,
        submittedAt: { not: null },
      },
    })

    // Tính remaining attempts
    const remainingAttempts = quiz.maxAttempts ? quiz.maxAttempts - myAttempts : null

    // Check có thể làm không
    let canTakeQuiz = true
    let reason: string | null = null

    const now = new Date()

    // Check time availability
    if (quiz.availableFrom && now < quiz.availableFrom) {
      canTakeQuiz = false
      reason = `Quiz will be available from ${quiz.availableFrom.toISOString()}`
    }

    if (quiz.availableTo && now > quiz.availableTo) {
      canTakeQuiz = false
      reason = `Quiz ended at ${quiz.availableTo.toISOString()}`
    }

    // Check max attempts
    if (quiz.maxAttempts && myAttempts >= quiz.maxAttempts) {
      canTakeQuiz = false
      reason = `You have reached the maximum number of attempts (${quiz.maxAttempts})`
    }

    // Check có attempt đang pending không
    const pendingAttempt = await this.prismaService.studentQuizAttempt.findFirst({
      where: {
        quizId: id,
        studentId,
        submittedAt: null,
      },
    })

    if (pendingAttempt) {
      canTakeQuiz = false
      reason = 'You have an unfinished attempt. Please complete or it will expire.'
    }

    return {
      ...quiz,
      remainingAttempts,
      myAttempts,
      canTakeQuiz,
      reason,
    }
  }

  async create({ data }: { data: CreateQuizBodyType }): Promise<QuizType> {
    const { questions, ...quizData } = data

    return this.prismaService.quiz.create({
      data: {
        ...quizData,
        deletedAt: null,
        questions: {
          create: questions,
        },
      },
    })
  }

  async update({ id, data }: { id: string; data: UpdateQuizBodyType }): Promise<QuizType> {
    const { questions, ...quizData } = data

    // Nếu có questions, xử lý riêng
    if (questions) {
      // Xóa tất cả questions cũ và tạo mới
      await this.prismaService.question.deleteMany({
        where: { quizId: id },
      })

      return this.prismaService.quiz.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          ...quizData,
          questions: {
            create: questions,
          },
        },
        include: {
          questions: true,
        },
      })
    }

    return this.prismaService.quiz.update({
      where: {
        id,
        deletedAt: null,
      },
      data: quizData,
    })
  }

  async delete({ id }: { id: string }): Promise<QuizType> {
    return this.prismaService.quiz.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  async getQuestions(quizId: string): Promise<QuestionType[]> {
    return this.prismaService.question.findMany({
      where: { quizId },
    })
  }

  // Tạo attempt mới khi start quiz
  async startAttempt({ studentId, quizId }: { studentId: string; quizId: string }): Promise<StudentQuizAttemptType> {
    return this.prismaService.studentQuizAttempt.create({
      data: {
        studentId,
        quizId,
        score: 0,
        isPassed: false,
        startedAt: new Date(),
        submittedAt: null,
        timeSpentSeconds: 0,
        answers: [],
      },
    }) as any
  }

  // Submit attempt
  async submitAttempt({
    attemptId,
    score,
    isPassed,
    timeSpentSeconds,
    answers,
  }: {
    attemptId: string
    score: number
    isPassed: boolean
    timeSpentSeconds: number
    answers: any[]
  }): Promise<StudentQuizAttemptType> {
    return this.prismaService.studentQuizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        isPassed,
        submittedAt: new Date(),
        timeSpentSeconds,
        answers: answers as any,
      },
    }) as any
  }

  async findAttemptById(attemptId: string): Promise<any> {
    return this.prismaService.studentQuizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    })
  }

  async getAttempts(query: {
    page: number
    limit: number
    studentId?: string
    quizId?: string
  }): Promise<GetQuizAttemptsResType> {
    const { page, limit, studentId, quizId } = query
    const skip = (page - 1) * limit
    const take = limit

    const where: Prisma.StudentQuizAttemptWhereInput = {
      submittedAt: { not: null }, // Chỉ lấy những attempt đã submit
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (quizId) {
      where.quizId = quizId
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.studentQuizAttempt.count({ where }),
      this.prismaService.studentQuizAttempt.findMany({
        where,
        skip,
        take,
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      }),
    ])

    return {
      data: data as any,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    }
  }

  async getStudentAttempts(studentId: string, quizId: string): Promise<StudentQuizAttemptType[]> {
    return this.prismaService.studentQuizAttempt.findMany({
      where: {
        studentId,
        quizId,
        submittedAt: { not: null },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    }) as any
  }

  // Xóa attempt nếu quá thời gian (auto-expire)
  async expireAttempt(attemptId: string): Promise<void> {
    await this.prismaService.studentQuizAttempt.delete({
      where: { id: attemptId },
    })
  }

  // Shuffle questions/options nếu cần
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
