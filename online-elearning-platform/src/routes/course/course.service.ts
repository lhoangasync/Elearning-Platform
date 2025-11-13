import { ForbiddenException, Injectable } from '@nestjs/common'
import { CourseRepository } from './course.repository'
import { CreateCourseBodyType, GetCoursesQueryType, UpdateCourseBodyType } from './course.model'
import { NotFoundRecordException } from 'src/shared/error'
import { RoleName } from 'src/shared/constants/role.constants'
import { CourseSlugExistsException } from './course.error'
import { isNotFoundPrismaError } from 'src/shared/helper'
import slugify from 'slugify'

@Injectable()
export class CourseService {
  constructor(private courseRepository: CourseRepository) {}

  private generateSlug(title: string): string {
    const slug = slugify(title, { lower: true, strict: true })
    return slug
  }

  async list(query: GetCoursesQueryType) {
    const data = await this.courseRepository.list(query)
    return data
  }

  async listByRole(query: GetCoursesQueryType, userId: string, roleName: string) {
    if (roleName === RoleName.Instructor) {
      // Instructors see only their courses
      return await this.courseRepository.listByInstructor(query, userId)
    } else if (roleName === RoleName.Admin) {
      // Admins see all courses
      return await this.courseRepository.list(query)
    } else {
      throw new ForbiddenException('You do not have permission to view this resource')
    }
  }

  async findById(id: string) {
    const course = await this.courseRepository.findById(id)
    if (!course) throw NotFoundRecordException
    return course
  }

  async findBySlug(slug: string) {
    const course = await this.courseRepository.findBySlug(slug)
    if (!course) throw NotFoundRecordException
    return course
  }

  async create({
    data,
    createdById,
    createdByRoleName,
  }: {
    data: CreateCourseBodyType
    createdById: string
    createdByRoleName: string
  }) {
    try {
      let instructorId: string

      if (createdByRoleName === RoleName.Admin) {
        instructorId = data.instructorId || createdById
      } else if (createdByRoleName === RoleName.Instructor) {
        instructorId = createdById
      } else {
        throw new ForbiddenException('Only instructors and admins can create courses')
      }

      const slug = data.slug ? data.slug : this.generateSlug(data.title)

      const slugExists = await this.courseRepository.checkSlugExists(slug)
      if (slugExists) throw CourseSlugExistsException

      return await this.courseRepository.create({
        data: {
          ...data,
          instructorId,
          slug,
        },
        createdById,
      })
    } catch (error) {
      throw error
    }
  }

  async update({
    id,
    data,
    updatedById,
    updatedByRoleName,
  }: {
    id: string
    data: UpdateCourseBodyType
    updatedById: string
    updatedByRoleName: string
  }) {
    try {
      // Kiểm tra course có tồn tại không
      const course = await this.courseRepository.findById(id)
      if (!course) throw NotFoundRecordException

      // Kiểm tra quyền: Admin được update tất cả, Instructor chỉ được update course của mình
      if (updatedByRoleName === RoleName.Instructor && course.instructorId !== updatedById) {
        throw new ForbiddenException('You can only update your own courses')
      }

      // Nếu update title, cần tạo slug mới
      let updateData = { ...data }
      if (data.title) {
        const newSlug = this.generateSlug(data.title)
        const slugExists = await this.courseRepository.checkSlugExists(newSlug, id)
        if (slugExists) throw CourseSlugExistsException
        updateData = { ...updateData, slug: newSlug } as any
      }

      // Admin có thể thay đổi instructorId
      if (data.instructorId && updatedByRoleName !== RoleName.Admin) {
        throw new ForbiddenException('Only admins can change course instructor')
      }

      return await this.courseRepository.update({
        id,
        data: updateData,
        updatedById,
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }

  async delete({ id, deletedById, deletedByRoleName }: { id: string; deletedById: string; deletedByRoleName: string }) {
    try {
      const course = await this.courseRepository.findById(id)
      if (!course) throw NotFoundRecordException

      // Kiểm tra quyền: Admin được xóa tất cả, Instructor chỉ được xóa course của mình
      if (deletedByRoleName === RoleName.Instructor && course.instructorId !== deletedById) {
        throw new ForbiddenException('You can only delete your own courses')
      }

      await this.courseRepository.delete({ id, deletedById })
      return { message: 'Course deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw NotFoundRecordException
      throw error
    }
  }
}
