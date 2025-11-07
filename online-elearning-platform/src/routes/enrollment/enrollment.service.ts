import { ForbiddenException, Injectable } from '@nestjs/common'
import { EnrollmentRepository } from './enrollment.repository'
import { EnrollCourseBodyType, GetEnrollmentsQueryType } from './enrollment.model'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { NotFoundRecordException } from 'src/shared/error'
import { RoleName } from 'src/shared/constants/role.constants'
import { CourseRepository } from '../course/course.repository'
import { AlreadyEnrolledException, CannotEnrollDraftCourseException, NotEnrolledException } from './enrollment.error'

@Injectable()
export class EnrollmentService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private courseRepository: CourseRepository,
  ) {}

  async list(query: GetEnrollmentsQueryType, userId: string, userRoleName: string) {
    // Admin có thể xem tất cả enrollments
    // Instructor chỉ xem enrollments của courses mình dạy
    // Student chỉ xem enrollments của chính mình

    if (userRoleName === RoleName.Student) {
      // Student chỉ được xem enrollments của chính mình
      return this.enrollmentRepository.list({
        ...query,
        studentId: userId,
      })
    } else if (userRoleName === RoleName.Instructor) {
      // Instructor cần courseId để xem enrollments của course mình dạy
      if (!query.courseId) {
        throw new ForbiddenException('Instructors must provide courseId to view enrollments')
      }

      // Kiểm tra course có phải của instructor này không
      const course = await this.courseRepository.findById(query.courseId)
      if (!course) throw NotFoundRecordException

      if (course.instructorId !== userId) {
        throw new ForbiddenException('You can only view enrollments of your own courses')
      }

      return this.enrollmentRepository.list(query)
    } else {
      // Admin xem tất cả
      return this.enrollmentRepository.list(query)
    }
  }

  async getMyEnrollments(studentId: string, query: Pick<GetEnrollmentsQueryType, 'page' | 'limit'>) {
    return this.enrollmentRepository.getMyEnrollments(studentId, query)
  }

  async findById(id: string, userId: string, userRoleName: string) {
    const enrollment = await this.enrollmentRepository.findById(id)
    if (!enrollment) throw NotFoundRecordException

    // Kiểm tra quyền truy cập
    if (userRoleName === RoleName.Student && enrollment.studentId !== userId) {
      throw new ForbiddenException('You can only view your own enrollments')
    }

    if (userRoleName === RoleName.Instructor && enrollment.course.instructor.id !== userId) {
      throw new ForbiddenException('You can only view enrollments of your own courses')
    }

    return enrollment
  }

  async enroll({ data, studentId }: { data: EnrollCourseBodyType; studentId: string }) {
    try {
      // Kiểm tra course có tồn tại không
      const course = await this.courseRepository.findById(data.courseId)
      if (!course) throw NotFoundRecordException

      // Kiểm tra course có PUBLISHED không
      if (course.status !== 'PUBLISHED') {
        throw CannotEnrollDraftCourseException
      }

      // Kiểm tra đã enroll chưa
      const alreadyEnrolled = await this.enrollmentRepository.checkEnrollment({
        studentId,
        courseId: data.courseId,
      })

      if (alreadyEnrolled) {
        throw AlreadyEnrolledException
      }

      return await this.enrollmentRepository.enroll({
        studentId,
        courseId: data.courseId,
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw AlreadyEnrolledException
      }
      throw error
    }
  }

  async unenroll({ courseId, studentId }: { courseId: string; studentId: string }) {
    try {
      // Tìm enrollment
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse({
        studentId,
        courseId,
      })

      if (!enrollment) {
        throw NotEnrolledException
      }

      await this.enrollmentRepository.unenroll({ id: enrollment.id })
      return { message: 'Unenrolled from course successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotEnrolledException
      throw error
    }
  }

  async deleteEnrollment({ id, userId, userRoleName }: { id: string; userId: string; userRoleName: string }) {
    try {
      const enrollment = await this.enrollmentRepository.findById(id)
      if (!enrollment) throw NotFoundRecordException

      // Chỉ Admin hoặc Student owner mới có thể xóa enrollment
      if (userRoleName === RoleName.Student && enrollment.studentId !== userId) {
        throw new ForbiddenException('You can only delete your own enrollments')
      }

      if (userRoleName === RoleName.Instructor) {
        throw new ForbiddenException('Instructors cannot delete enrollments')
      }

      await this.enrollmentRepository.unenroll({ id })
      return { message: 'Enrollment deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }
}
