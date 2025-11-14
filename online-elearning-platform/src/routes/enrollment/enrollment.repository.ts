import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  EnrollmentType,
  EnrollResType,
  GetEnrollmentDetailResType,
  GetEnrollmentsQueryType,
  GetEnrollmentsResType,
  GetMyEnrollmentsResType,
} from './enrollment.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class EnrollmentRepository {
  constructor(private prismaService: PrismaService) {}

  async list(query: GetEnrollmentsQueryType): Promise<GetEnrollmentsResType> {
    const { page, limit, courseId, studentId } = query
    const skip = (page - 1) * limit
    const take = limit

    const where: Prisma.EnrollmentWhereInput = {}

    if (courseId) {
      where.courseId = courseId
    }

    if (studentId) {
      where.studentId = studentId
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.enrollment.count({ where }),
      this.prismaService.enrollment.findMany({
        where,
        skip,
        take,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              level: true,
              instructor: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
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

  async getMyEnrollments(
    studentId: string,
    query: Pick<GetEnrollmentsQueryType, 'page' | 'limit'>,
  ): Promise<GetMyEnrollmentsResType> {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const take = limit

    const where: Prisma.EnrollmentWhereInput = {
      studentId,
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.enrollment.count({ where }),
      this.prismaService.enrollment.findMany({
        where,
        skip,
        take,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              level: true,
              slug: true,
              instructor: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  chapters: true,
                },
              },
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
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

  async findById(id: string): Promise<GetEnrollmentDetailResType | null> {
    return this.prismaService.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            level: true,
            status: true,
            instructor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            chapters: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                position: 'asc',
              },
              select: {
                id: true,
                title: true,
                position: true,
                lessons: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    position: 'asc',
                  },
                  select: {
                    id: true,
                    title: true,
                    position: true,
                    duration: true,
                    videoUrl: true,
                    documentUrl: true,
                    content: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  async enroll({ studentId, courseId }: { studentId: string; courseId: string }): Promise<EnrollResType> {
    return this.prismaService.enrollment.create({
      data: {
        studentId,
        courseId,
      },
    })
  }

  async unenroll({ id }: { id: string }): Promise<EnrollmentType> {
    return this.prismaService.enrollment.delete({
      where: { id },
    })
  }

  async checkEnrollment({ studentId, courseId }: { studentId: string; courseId: string }): Promise<boolean> {
    const enrollment = await this.prismaService.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    })
    return !!enrollment
  }

  async findByStudentAndCourse({
    studentId,
    courseId,
  }: {
    studentId: string
    courseId: string
  }): Promise<EnrollmentType | null> {
    return this.prismaService.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    })
  }
}
