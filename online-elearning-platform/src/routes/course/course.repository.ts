import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CourseType,
  CreateCourseBodyType,
  GetCourseDetailResType,
  GetCoursesQueryType,
  GetCoursesResType,
  UpdateCourseBodyType,
} from './course.model'
import { Prisma } from '@prisma/client'

@Injectable()
export class CourseRepository {
  constructor(private prismaService: PrismaService) {}

  async list(query: GetCoursesQueryType): Promise<GetCoursesResType> {
    const { page, limit, level, status, search } = query
    const skip = (page - 1) * limit
    const take = limit

    // Build where clause
    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
    }

    if (level) {
      where.level = level
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.course.count({ where }),
      this.prismaService.course.findMany({
        where,
        skip,
        take,
        include: {
          instructor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              chapters: true,
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

  async listByInstructor(query: GetCoursesQueryType, instructorId: string): Promise<GetCoursesResType> {
    const { page, limit, level, status, search } = query
    const skip = (page - 1) * limit
    const take = limit

    // Build where clause
    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      instructorId,
    }

    if (level) {
      where.level = level
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [totalItems, data] = await Promise.all([
      this.prismaService.course.count({ where }),
      this.prismaService.course.findMany({
        where,
        skip,
        take,
        include: {
          instructor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              chapters: true,
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

  findById(id: string): Promise<GetCourseDetailResType | null> {
    return this.prismaService.course.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        chapters: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            position: 'asc',
          },
          include: {
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
                videoUrl: true,
                documentUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })
  }

  findBySlug(slug: string): Promise<GetCourseDetailResType | null> {
    return this.prismaService.course.findUnique({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        instructor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        chapters: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            position: 'asc',
          },
          include: {
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
                videoUrl: true,
                documentUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })
  }

  create({
    data,
    createdById,
  }: {
    data: CreateCourseBodyType & { instructorId: string; slug: string }
    createdById: string
  }): Promise<CourseType> {
    return this.prismaService.course.create({
      data: {
        ...data,
        createdById,
        deletedAt: null,
      },
    })
  }

  update({
    id,
    data,
    updatedById,
  }: {
    id: string
    data: UpdateCourseBodyType
    updatedById: string
  }): Promise<CourseType> {
    return this.prismaService.course.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        ...data,
        updatedById,
      },
    })
  }

  delete({ id, deletedById }: { id: string; deletedById: string }, isHard?: boolean): Promise<CourseType> {
    return isHard
      ? this.prismaService.course.delete({
          where: {
            id,
          },
        })
      : this.prismaService.course.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            deletedById,
          },
        })
  }

  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const course = await this.prismaService.course.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    })
    return !!course
  }
}
