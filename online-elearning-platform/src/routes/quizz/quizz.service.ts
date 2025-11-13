import { ForbiddenException, Injectable } from '@nestjs/common'
import { QuizRepository } from './quizz.repository'
import {
  CreateQuizBodyType,
  GetQuizzesForAdminQueryType,
  GetQuizzesQueryType,
  StartQuizBodyType,
  StartQuizResType,
  SubmitQuizBodyType,
  SubmitQuizResType,
  UpdateQuizBodyType,
} from './quizz.model'
import { isNotFoundPrismaError } from 'src/shared/helper'
import { NotFoundRecordException } from 'src/shared/error'
import { RoleName } from 'src/shared/constants/role.constants'
import { CourseRepository } from '../course/course.repository'
import { EnrollmentRepository } from '../enrollment/enrollment.repository'
import {
  AttemptExpiredException,
  AttemptNotFoundException,
  QuizNotAccessibleException,
  QuizNotAvailableException,
} from './quizz.error'

@Injectable()
export class QuizService {
  constructor(
    private quizRepository: QuizRepository,
    private courseRepository: CourseRepository,
    private enrollmentRepository: EnrollmentRepository,
  ) {}

  async list(query: GetQuizzesQueryType) {
    return this.quizRepository.list(query)
  }

  async listForAdmin(query: GetQuizzesForAdminQueryType) {
    return this.quizRepository.listForAdmin(query)
  }

  async listForInstructor(query: GetQuizzesQueryType, instructorId: string) {
    return this.quizRepository.listForInstructor(query, instructorId)
  }

  async findById(id: string, userId: string, userRoleName: string) {
    if (userRoleName === RoleName.Student) {
      // Student xem quiz info (không có đáp án)
      const quiz = await this.quizRepository.findByIdForStudent(id, userId)
      if (!quiz) throw NotFoundRecordException

      // Kiểm tra student có enroll course này không
      const isEnrolled = await this.enrollmentRepository.checkEnrollment({
        studentId: userId,
        courseId: quiz.courseId,
      })

      if (!isEnrolled) {
        throw QuizNotAccessibleException
      }

      // Shuffle questions nếu cần
      if (quiz.shuffleQuestions) {
        quiz.questions = this.quizRepository.shuffleArray(quiz.questions)
      }

      // Shuffle options nếu cần
      if (quiz.shuffleOptions) {
        quiz.questions = quiz.questions.map((q) => ({
          ...q,
          options: this.quizRepository.shuffleArray(q.options),
        }))
      }

      return quiz
    } else {
      // Instructor/Admin xem full (có đáp án)
      const quiz = await this.quizRepository.findById(id)
      if (!quiz) throw NotFoundRecordException

      // Instructor chỉ xem quiz của course mình dạy
      if (userRoleName === RoleName.Instructor && quiz.course.instructorId !== userId) {
        throw new ForbiddenException('You can only view quizzes of your own courses')
      }

      return quiz
    }
  }

  async create({ data, userId, userRoleName }: { data: CreateQuizBodyType; userId: string; userRoleName: string }) {
    try {
      // Kiểm tra course có tồn tại không
      const course = await this.courseRepository.findById(data.courseId)
      if (!course) throw NotFoundRecordException

      // Kiểm tra quyền: Admin hoặc Instructor owner
      if (userRoleName === RoleName.Instructor && course.instructorId !== userId) {
        throw new ForbiddenException('You can only create quizzes for your own courses')
      }

      return await this.quizRepository.create({ data })
    } catch (error) {
      throw error
    }
  }

  async update({
    id,
    data,
    userId,
    userRoleName,
  }: {
    id: string
    data: UpdateQuizBodyType
    userId: string
    userRoleName: string
  }) {
    try {
      // Kiểm tra quiz có tồn tại không
      const quiz = await this.quizRepository.findById(id)
      if (!quiz) throw NotFoundRecordException

      // Kiểm tra quyền: Admin hoặc Instructor owner
      if (userRoleName === RoleName.Instructor && quiz.course.instructorId !== userId) {
        throw new ForbiddenException('You can only update quizzes of your own courses')
      }

      return await this.quizRepository.update({ id, data })
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }

  async delete({ id, userId, userRoleName }: { id: string; userId: string; userRoleName: string }) {
    try {
      // Kiểm tra quiz có tồn tại không
      const quiz = await this.quizRepository.findById(id)
      if (!quiz) throw NotFoundRecordException

      // Kiểm tra quyền: Admin hoặc Instructor owner
      if (userRoleName === RoleName.Instructor && quiz.course.instructorId !== userId) {
        throw new ForbiddenException('You can only delete quizzes of your own courses')
      }

      await this.quizRepository.delete({ id })
      return { message: 'Quiz deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }

  // Start quiz - tạo attempt mới
  async startQuiz({ data, studentId }: { data: StartQuizBodyType; studentId: string }): Promise<StartQuizResType> {
    // Lấy quiz info
    const quiz = await this.quizRepository.findByIdForStudent(data.quizId, studentId)
    if (!quiz) throw NotFoundRecordException

    // Kiểm tra student có enroll course này không
    const isEnrolled = await this.enrollmentRepository.checkEnrollment({
      studentId,
      courseId: quiz.courseId,
    })

    if (!isEnrolled) {
      throw QuizNotAccessibleException
    }

    // Kiểm tra có thể làm không
    if (!quiz.canTakeQuiz) {
      throw QuizNotAvailableException(quiz.reason || 'Quiz is not available')
    }

    // Tạo attempt
    const attempt = await this.quizRepository.startAttempt({
      studentId,
      quizId: data.quizId,
    })

    // Tính thời gian hết hạn
    let expiresAt: Date | null = null
    if (quiz.timeLimitMinutes) {
      expiresAt = new Date(attempt.startedAt.getTime() + quiz.timeLimitMinutes * 60 * 1000)
    }

    return {
      attemptId: attempt.id,
      quiz,
      startedAt: attempt.startedAt,
      expiresAt,
      timeLimitSeconds: quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null,
    }
  }

  // Submit quiz
  async submitQuiz({ data, studentId }: { data: SubmitQuizBodyType; studentId: string }): Promise<SubmitQuizResType> {
    // Lấy attempt
    const attempt = await this.quizRepository.findAttemptById(data.attemptId)
    if (!attempt) throw AttemptNotFoundException

    // Kiểm tra attempt có phải của student này không
    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('This attempt does not belong to you')
    }

    // Kiểm tra đã submit chưa
    if (attempt.submittedAt) {
      throw new ForbiddenException('This attempt has already been submitted')
    }

    // Kiểm tra thời gian
    const now = new Date()
    const timeSpentSeconds = Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)

    if (attempt.quiz.timeLimitMinutes) {
      const timeLimit = attempt.quiz.timeLimitMinutes * 60
      if (timeSpentSeconds > timeLimit + 60) {
        // Cho phép submit muộn 1 phút
        // Xóa attempt vì đã quá hạn
        await this.quizRepository.expireAttempt(data.attemptId)
        throw AttemptExpiredException
      }
    }

    // Lấy tất cả questions của quiz
    const questions = attempt.quiz.questions

    // Tính điểm
    let correctAnswers = 0
    const results = questions.map((question) => {
      const answer = data.answers.find((a) => a.questionId === question.id)
      const isCorrect = answer ? answer.selectedAnswerIndex === question.correctAnswerIndex : false

      if (isCorrect) correctAnswers++

      const result: any = {
        questionId: question.id,
        questionText: question.text,
        selectedAnswerIndex: answer?.selectedAnswerIndex ?? -1,
        isCorrect,
      }

      // Chỉ show correct answer nếu quiz config cho phép
      if (attempt.quiz.showCorrectAnswers) {
        result.correctAnswerIndex = question.correctAnswerIndex
      }

      return result
    })

    const score = Math.round((correctAnswers / questions.length) * 100)
    const isPassed = score >= attempt.quiz.passingScore

    // Lưu câu trả lời
    const answersToSave = results.map((r) => ({
      questionId: r.questionId,
      selectedAnswerIndex: r.selectedAnswerIndex,
      isCorrect: r.isCorrect,
    }))

    // Update attempt
    await this.quizRepository.submitAttempt({
      attemptId: data.attemptId,
      score,
      isPassed,
      timeSpentSeconds,
      answers: answersToSave,
    })

    return {
      attemptId: attempt.id,
      score,
      isPassed,
      passingScore: attempt.quiz.passingScore,
      totalQuestions: questions.length,
      correctAnswers,
      timeSpentSeconds,
      showCorrectAnswers: attempt.quiz.showCorrectAnswers,
      results,
    }
  }

  async getAttempts(query: {
    page: number
    limit: number
    studentId?: string
    quizId?: string
    userId: string
    userRoleName: string
  }) {
    const { userId, userRoleName, ...queryData } = query

    // Student chỉ xem attempts của mình
    if (userRoleName === RoleName.Student) {
      return this.quizRepository.getAttempts({
        ...queryData,
        studentId: userId,
      })
    }

    // Instructor xem attempts của quizzes trong courses mình dạy
    if (userRoleName === RoleName.Instructor && queryData.quizId) {
      const quiz = await this.quizRepository.findById(queryData.quizId)
      if (!quiz) throw NotFoundRecordException

      if (quiz.course.instructorId !== userId) {
        throw new ForbiddenException('You can only view attempts of your own courses')
      }
    }

    // Admin xem tất cả
    return this.quizRepository.getAttempts(queryData)
  }

  async getAttemptDetail(attemptId: string, userId: string, userRoleName: string) {
    const attempt = await this.quizRepository.findAttemptById(attemptId)
    if (!attempt) throw NotFoundRecordException

    // Student chỉ xem attempt của mình
    if (userRoleName === RoleName.Student && attempt.studentId !== userId) {
      throw new ForbiddenException('You can only view your own attempts')
    }

    // Instructor chỉ xem attempts của course mình dạy
    if (userRoleName === RoleName.Instructor && attempt.quiz.course.instructorId !== userId) {
      throw new ForbiddenException('You can only view attempts of your own courses')
    }

    return attempt
  }

  async getMyAttempts(studentId: string, quizId: string) {
    return this.quizRepository.getStudentAttempts(studentId, quizId)
  }
}
